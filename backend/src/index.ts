import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { PHARMACIES as staticPharmacies } from "./data/pharmacies";
import { MEDICATIONS as staticMedications } from "./data/medications";
import { Pharmacy } from "./models/Pharmacy.entity";
import { Medication } from "./models/Medication.entity";
import { StockEntry, AvailabilityStatus } from "./models/StockEntry.entity";
import { User, UserRole } from "./models/User.entity";
import { buildSeedStock } from "./utils/seed-data";
import { seedUsers } from "./utils/seed-users";
import { corsMiddleware } from "./middleware/cors";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter";
import { requestLogger, log, LogLevel } from "./middleware/logger";
import { signToken, authenticate, authorizeAdmin, authorizePharmacyOwner } from "./auth";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);
app.use("/api/", apiLimiter);

async function startServer() {
  try {
    await AppDataSource.initialize();
    log(LogLevel.INFO, "✅ Database initialized");

    const pharmacyRepository = AppDataSource.getRepository(Pharmacy);
    const medicationRepository = AppDataSource.getRepository(Medication);
    const stockEntryRepository = AppDataSource.getRepository(StockEntry);
    const userRepository = AppDataSource.getRepository(User);

    if ((await pharmacyRepository.count()) === 0) {
      await pharmacyRepository.save(staticPharmacies);
      log(LogLevel.INFO, "✅ Pharmacies seeded");
    }

    if ((await medicationRepository.count()) === 0) {
      await medicationRepository.save(staticMedications);
      log(LogLevel.INFO, "✅ Medications seeded");
    }

    const pharmacies = await pharmacyRepository.find();
    await seedUsers(pharmacies);

    try {
      const stockCount = await stockEntryRepository.count();
      if (stockCount === 0) {
        const initialStockMap = buildSeedStock(staticMedications, staticPharmacies);
        const stockEntriesToSave: StockEntry[] = [];

        for (const medId in initialStockMap) {
          for (const pharmacyId in initialStockMap[medId]) {
            const entry = initialStockMap[medId][pharmacyId];
            const stock = new StockEntry();
            stock.medicationId = medId;
            stock.pharmacyId = pharmacyId;
            stock.status = entry.status;
            stock.price = entry.price;
            stock.updatedAt = entry.updatedAt;
            stockEntriesToSave.push(stock);
          }
        }

        const chunkSize = 500;
        for (let i = 0; i < stockEntriesToSave.length; i += chunkSize) {
          const chunk = stockEntriesToSave.slice(i, i + chunkSize);
          await stockEntryRepository.save(chunk);
        }
        log(LogLevel.INFO, `✅ Stock entries seeded (${stockEntriesToSave.length} entries)`);
      }
    } catch (error) {
      log(LogLevel.WARN, "Could not seed stock entries", { error: String(error) });
    }

    app.get("/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    app.post("/api/login", authLimiter, async (req, res) => {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await userRepository.findOne({ where: { username } });

      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      user.lastLoginAt = new Date();
      await userRepository.save(user);

      const token = signToken(user);
      log(LogLevel.INFO, `User logged in: ${user.username}`);

      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          pharmacyId: user.pharmacyId,
        },
      });
    });

    app.get("/api/pharmacies", async (req, res) => {
      const pharmacies = await pharmacyRepository.find();
      res.json(pharmacies);
    });

    app.get("/api/pharmacies/:id", async (req, res) => {
      const pharmacy = await pharmacyRepository.findOne({ where: { id: req.params.id } });
      if (!pharmacy) return res.status(404).json({ message: "Pharmacy not found" });
      res.json(pharmacy);
    });

    app.patch(
      "/api/pharmacies/:pharmacyId",
      authenticate,
      authorizePharmacyOwner,
      async (req, res) => {
        const { pharmacyId } = req.params;
        const { name, address, phone, hours, quartier, lat, lng } = req.body;

        const pharmacy = await pharmacyRepository.findOne({ where: { id: pharmacyId } });
        if (!pharmacy) return res.status(404).json({ message: "Pharmacy not found" });

        if (name !== undefined) pharmacy.name = name;
        if (address !== undefined) pharmacy.address = address;
        if (phone !== undefined) pharmacy.phone = phone;
        if (hours !== undefined) pharmacy.hours = hours;
        if (quartier !== undefined) pharmacy.quartier = quartier;
        if (lat !== undefined) pharmacy.lat = lat;
        if (lng !== undefined) pharmacy.lng = lng;

        await pharmacyRepository.save(pharmacy);
        log(LogLevel.INFO, `Pharmacy updated: ${pharmacyId}`);
        res.json(pharmacy);
      }
    );

    app.get("/api/medications", async (req, res) => {
      const medications = await medicationRepository.find();
      res.json(medications);
    });

    app.get("/api/medications/:id", async (req, res) => {
      const medication = await medicationRepository.findOne({ where: { id: req.params.id } });
      if (!medication) return res.status(404).json({ message: "Medication not found" });
      res.json(medication);
    });

    app.get("/api/stock", async (req, res) => {
      const stock = await stockEntryRepository.find({
        relations: ["medication", "pharmacy"],
      });
      res.json(stock);
    });

    app.get("/api/stock/:medicationId/:pharmacyId", async (req, res) => {
      const { medicationId, pharmacyId } = req.params;
      const stock = await stockEntryRepository.findOne({
        where: { medicationId, pharmacyId },
        relations: ["medication", "pharmacy"],
      });
      if (!stock) return res.status(404).json({ message: "Stock entry not found" });
      res.json(stock);
    });

    app.patch(
      "/api/stock/:medicationId/:pharmacyId",
      authenticate,
      authorizePharmacyOwner,
      async (req, res) => {
        const { medicationId, pharmacyId } = req.params;
        const { status, price } = req.body;

        if (!status || !Object.values(AvailabilityStatus).includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }

        let stock = await stockEntryRepository.findOne({
          where: { medicationId, pharmacyId },
        });

        if (!stock) {
          return res.status(404).json({ message: "Stock entry not found" });
        }

        stock.status = status;
        stock.price = price ?? null;
        stock.updatedAt = new Date().toISOString();

        await stockEntryRepository.save(stock);
        log(LogLevel.INFO, `Stock updated: ${medicationId} @ ${pharmacyId}`);
        res.json(stock);
      }
    );

    app.post("/api/admin/users", authenticate, authorizeAdmin, async (req, res) => {
      const { username, password, role, pharmacyId } = req.body;

      if (!username || !password || !role) {
        return res.status(400).json({ message: "Username, password, and role required" });
      }

      const existing = await userRepository.findOne({ where: { username } });
      if (existing) {
        return res.status(409).json({ message: "User already exists" });
      }

      const user = new User();
      user.username = username;
      user.passwordHash = await bcrypt.hash(password, 10);
      user.role = role;
      user.pharmacyId = pharmacyId || null;
      user.isActive = true;

      await userRepository.save(user);
      log(LogLevel.INFO, `New user created: ${username}`);

      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        pharmacyId: user.pharmacyId,
      });
    });

    app.get("/api/admin/users", authenticate, authorizeAdmin, async (req, res) => {
      const users = await userRepository.find({
        select: ["id", "username", "role", "pharmacyId", "isActive", "lastLoginAt", "createdAt"],
      });
      res.json(users);
    });

    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      log(LogLevel.ERROR, "Unhandled error", {
        message: err.message,
        stack: err.stack,
        path: req.path,
      });
      res.status(500).json({ message: "Internal server error" });
    });

    app.listen(PORT, () => {
      log(LogLevel.INFO, `🚀 Server running on http://localhost:${PORT}`);
      log(LogLevel.INFO, `📊 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    log(LogLevel.ERROR, "Failed to start server", { error: String(error) });
    process.exit(1);
  }
}

startServer();

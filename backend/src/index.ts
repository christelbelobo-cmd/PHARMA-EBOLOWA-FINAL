import "reflect-metadata"; // Must be imported first
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import { PHARMACIES as staticPharmacies } from './data/pharmacies';
import { MEDICATIONS as staticMedications } from './data/medications';
import { Pharmacy } from './models/Pharmacy.entity';
import { Medication } from './models/Medication.entity';
import { StockEntry, AvailabilityStatus } from './models/StockEntry.entity'; // Import StockEntry and its enum
import { buildSeedStock } from './utils/seed-data'; // Import from backend's utils
import { findUserByUsername, USERS } from './users';
import { signToken, authenticate, authorizePharmacistOrAdminForPharmacy } from './auth';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

AppDataSource.initialize()
  .then(async () => {
    console.log("Data Source has been initialized!");

    const pharmacyRepository = AppDataSource.getRepository(Pharmacy);
    const medicationRepository = AppDataSource.getRepository(Medication);
    const stockEntryRepository = AppDataSource.getRepository(StockEntry);

    // Check if data exists, if not, seed it
    if ((await pharmacyRepository.count()) === 0) {
      await pharmacyRepository.save(staticPharmacies);
      console.log("Pharmacies have been seeded!");
    }

    if ((await medicationRepository.count()) === 0) {
      await medicationRepository.save(staticMedications);
      console.log("Medications have been seeded!");
    }

    try {
      const stockCountResult = await AppDataSource.query(`SELECT COUNT(*) FROM stock_entry`);
      if (parseInt(stockCountResult[0]["COUNT(*)"], 10) === 0) {
        const initialStockMap = buildSeedStock(staticMedications, staticPharmacies);
        const stockEntriesToSave: StockEntry[] = [];

        for (const medId in initialStockMap) {
          for (const pharmacyId in initialStockMap[medId]) {
            const entry = initialStockMap[medId][pharmacyId];
            stockEntriesToSave.push({
              medicationId: medId,
              pharmacyId: pharmacyId,
              medication: { id: medId } as Medication,
              pharmacy: { id: pharmacyId } as Pharmacy,
              status: entry.status,
              price: entry.price,
              updatedAt: entry.updatedAt,
            });
          }
        }

        // Save in manageable chunks to avoid exceeding SQLite expression depth limits
        const chunkSize = 200;
        for (let i = 0; i < stockEntriesToSave.length; i += chunkSize) {
          const chunk = stockEntriesToSave.slice(i, i + chunkSize);
          await stockEntryRepository.save(chunk);
        }

        console.log("Stock entries have been seeded!");
      }
    } catch (error) {
      console.warn("Could not check or seed stock entries, possibly table not yet created or already populated:", error);
    }

    app.get('/', (req, res) => {
      res.send('Backend API is running!');
    });

    app.post('/api/login', async (req, res) => {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ message: 'username + password required' });
      const user = findUserByUsername(username);
      if (!user) return res.status(401).json({ message: 'invalid credentials' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ message: 'invalid credentials' });
      const token = signToken({ username: user.username, role: user.role, pharmacyId: user.pharmacyId });
      return res.json({ token, user: { username: user.username, role: user.role, pharmacyId: user.pharmacyId } });
    });

    app.get('/api/pharmacies', async (req, res) => {
      const pharmacies = await pharmacyRepository.find();
      res.json(pharmacies);
    });

    app.get('/api/medications', async (req, res) => {
      const medications = await medicationRepository.find();
      res.json(medications);
    });

    app.get('/api/stock', async (req, res) => {
      const stock = await stockEntryRepository.find({ relations: ["medication", "pharmacy"] });
      res.json(stock);
    });

    // Protected update: admin can update any, pharmacist only own pharmacy
    app.patch('/api/stock/:medId/:pharmacyId', authenticate, authorizePharmacistOrAdminForPharmacy('pharmacyId'), async (req, res) => {
      const { medId, pharmacyId } = req.params;
      const { status, price } = req.body;

      const stockEntry = await stockEntryRepository.findOne({ where: { medicationId: medId, pharmacyId: pharmacyId } });

      if (!stockEntry) {
        return res.status(404).json({ message: "Stock entry not found" });
      }

      stockEntry.status = status as AvailabilityStatus;
      stockEntry.price = price;
      stockEntry.updatedAt = new Date().toISOString();

      await stockEntryRepository.save(stockEntry);
      res.json(stockEntry);
    });


    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => console.error("Error during Data Source initialization:", error));


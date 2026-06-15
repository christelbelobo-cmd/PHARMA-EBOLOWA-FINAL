import "reflect-metadata";
import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import { PHARMACIES as staticPharmacies } from './data/pharmacies';
import { MEDICATIONS as staticMedications } from './data/medications';
import { Pharmacy } from './models/Pharmacy.entity';
import { Medication } from './models/Medication.entity';
import { StockEntry, AvailabilityStatus } from './models/StockEntry.entity'; 
import { buildSeedStock } from './utils/seed-data'; 
import { findUserByUsername } from './users';
import { signToken, authenticate, authorizePharmacistOrAdminForPharmacy } from './auth';
import * as bcrypt from 'bcryptjs';

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

    if ((await pharmacyRepository.count()) === 0) {
      await pharmacyRepository.save(staticPharmacies);
    }

    if ((await medicationRepository.count()) === 0) {
      await medicationRepository.save(staticMedications);
    }

    try {
      const stockCountResult = await AppDataSource.query(`SELECT COUNT(*) as count FROM stock_entry`);
      const count = parseInt(String(stockCountResult[0].count || 0), 10);
      if (count === 0) {
        const initialStockMap = buildSeedStock(staticMedications, staticPharmacies);
        const stockEntriesToSave: StockEntry[] = [];
        for (const medId in initialStockMap) {
          for (const pharmacyId in initialStockMap[medId]) {
            const entry = initialStockMap[medId][pharmacyId];
            const newEntry = new StockEntry();
            newEntry.medicationId = medId;
            newEntry.pharmacyId = pharmacyId;
            newEntry.status = entry.status as AvailabilityStatus;
            newEntry.price = entry.price;
            newEntry.updatedAt = new Date(entry.updatedAt);
            stockEntriesToSave.push(newEntry);
          }
        }
        await stockEntryRepository.save(stockEntriesToSave);
        console.log("Stock entries seeded!");
      }
    } catch (e) {
        console.error("Seeding error:", e);
    }

    app.post('/api/login', async (req: Request, res: Response) => {
      const { username, password } = req.body;
      const user = await findUserByUsername(username);
      if (!user) return res.status(401).json({ message: 'invalid' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ message: 'invalid' });
      const token = signToken({ username: user.username, role: user.role, pharmacyId: user.pharmacyId });
      return res.json({ token, user: { username: user.username, role: user.role, pharmacyId: user.pharmacyId } });
    });

    app.get('/api/pharmacies', async (req: Request, res: Response) => {
      res.json(await pharmacyRepository.find());
    });

    app.get('/api/medications', async (req: Request, res: Response) => {
      res.json(await medicationRepository.find());
    });

    app.get('/api/stock', async (req: Request, res: Response) => {
      res.json(await stockEntryRepository.find({ relations: ["medication", "pharmacy"] }));
    });

    app.patch('/api/stock/:medId/:pharmacyId', authenticate, authorizePharmacistOrAdminForPharmacy('pharmacyId'), async (req: Request, res: Response) => {
      const { medId, pharmacyId } = req.params;
      const { status, price } = req.body;
      const stockEntry = await stockEntryRepository.findOne({ where: { medicationId: String(medId), pharmacyId: String(pharmacyId) } });
      if (!stockEntry) return res.status(404).send();
      stockEntry.status = status as AvailabilityStatus;
      stockEntry.price = price;
      stockEntry.updatedAt = new Date();
      await stockEntryRepository.save(stockEntry);
      res.json(stockEntry);
    });

    app.listen(PORT, () => console.log(`Server on ${PORT}`));
  })
  .catch(console.error);


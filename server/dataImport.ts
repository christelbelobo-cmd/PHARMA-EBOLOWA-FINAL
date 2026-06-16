import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import multer from "multer";
import { z } from "zod";
import { getDb } from "./db";
import { pharmacies, medications, stockEntries } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import csv from "csv-parser";
import { Readable } from "stream";

// Configure Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

export const dataImportRouter = router({
  uploadData: publicProcedure
    .input(z.object({
      file: z.any(), // Multer will handle the file, Zod can't validate file directly
    }))
    .mutation(async ({ ctx, input }) => {
      const fileBuffer = input.file as Buffer;
      const results: any[] = [];

      return new Promise((resolve, reject) => {
        Readable.from(fileBuffer.toString())
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', async () => {
            console.log('CSV parsed results:', results);

            const db = await getDb(); // Obtenir l'instance de la base de données
            if (!db) {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Database connection not available.',
              });
            }

            // Process the results here
            // For each row, find or create pharmacy, find or create medication, then create/update stock entry

            for (const row of results) {
              // 1. Find or create Pharmacy
              let pharmacy = await db.select().from(pharmacies).where(eq(pharmacies.name, row.pharmacy_name)).limit(1);
              let pharmacyId: number;

              if (pharmacy.length === 0) {
                // Create new pharmacy
                const [newPharmacy] = await db.insert(pharmacies).values({
                  name: row.pharmacy_name,
                  address: row.pharmacy_address,
                  phone: row.pharmacy_phone,
                  email: row.pharmacy_email,
                  openingHours: row.pharmacy_openingHours,
                  mapLink: row.pharmacy_mapLink,
                  latitude: parseFloat(row.pharmacy_latitude),
                  longitude: parseFloat(row.pharmacy_longitude),
                  isOnDuty: row.pharmacy_isOnDuty === 'TRUE',
                });
                pharmacyId = newPharmacy.insertId;
              } else {
                pharmacyId = pharmacy[0].id;
              }

              // 2. Find or create Medication
              let medication = await db.select().from(medications).where(eq(medications.name, row.medication_name)).limit(1);
              let medicationId: number;

              if (medication.length === 0) {
                // Create new medication
                const [newMedication] = await db.insert(medications).values({
                  name: row.medication_name,
                  dci: row.medication_dci,
                  therapeuticCategory: row.medication_therapeuticCategory,
                  dosage: row.medication_dosage,
                });
                medicationId = newMedication.insertId;
              } else {
                medicationId = medication[0].id;
              }

              // 3. Create or update StockEntry
              const existingStock = await db.select().from(stockEntries)
                .where(eq(stockEntries.medicationId, medicationId))
                .where(eq(stockEntries.pharmacyId, pharmacyId))
                .limit(1);

              if (existingStock.length === 0) {
                await db.insert(stockEntries).values({
                  medicationId: medicationId,
                  pharmacyId: pharmacyId,
                  status: row.stock_status,
                  price: parseFloat(row.stock_price),
                  quantity: parseInt(row.stock_quantity),
                });
              } else {
                await db.update(stockEntries)
                  .set({
                    status: row.stock_status,
                    price: parseFloat(row.stock_price),
                    quantity: parseInt(row.stock_quantity),
                    updatedAt: new Date(),
                  })
                  .where(eq(stockEntries.id, existingStock[0].id));
              }
            }

            resolve({ success: true, message: "Data imported successfully" });
          })
          .on('error', (error) => {
            console.error('Error parsing CSV:', error);
            reject(new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to parse CSV file.',
              cause: error,
            }));
          });
      });
    }),
});

export type DataImportRouter = typeof dataImportRouter;

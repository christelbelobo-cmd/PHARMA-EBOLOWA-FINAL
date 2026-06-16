import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc"; // Rendu sécurisé (seul un admin/pharmacien connecté peut importer)
import { z } from "zod";
import { getDb } from "./db";
import { pharmacies, medications, stockEntries } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import csv from "csv-parser";
import { Readable } from "stream";

export const dataImportRouter = router({
  // Utilisation de protectedProcedure pour éviter que n'importe qui injecte des données
  uploadData: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(), // On reçoit le texte brut du CSV, beaucoup plus simple et robuste avec tRPC
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results: any[] = [];

      return new Promise((resolve, reject) => {
        // On crée un flux lisible directement à partir de la chaîne de caractères
        Readable.from(input.csvContent)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', async () => {
            try {
              console.log('CSV parsed results:', results);

              const db = await getDb();
              if (!db) {
                return reject(new TRPCError({
                  code: 'INTERNAL_SERVER_ERROR',
                  message: 'Database connection not available.',
                }));
              }

              for (const row of results) {
                // Validation minimale pour sauter les lignes vides accidentelles
                if (!row.pharmacy_name || !row.medication_name) continue;

                // 1. Trouver ou créer la Pharmacie
                let pharmacy = await db.select().from(pharmacies).where(eq(pharmacies.name, row.pharmacy_name)).limit(1);
                let pharmacyId: number;

                if (pharmacy.length === 0) {
                  // Si l'utilisateur connecté est un simple pharmacien, on peut optionnellement lui interdire de créer d'autres officines
                  const [newPharmacy] = await db.insert(pharmacies).values({
                    name: row.pharmacy_name,
                    address: row.pharmacy_address || "Adresse non spécifiée",
                    phone: row.pharmacy_phone || null,
                    email: row.pharmacy_email || null,
                    openingHours: row.pharmacy_openingHours || null,
                    mapLink: row.pharmacy_mapLink || null,
                    latitude: row.pharmacy_latitude ? parseFloat(row.pharmacy_latitude) : 2.92, // Coordonnées par défaut d'Ebolowa au besoin
                    longitude: row.pharmacy_longitude ? parseFloat(row.pharmacy_longitude) : 11.15,
                    isOnDuty: row.pharmacy_isOnDuty === 'TRUE' || row.pharmacy_isOnDuty === 'true',
                  });
                  // Note: selon ta version du connecteur mysql/sqlite, utilise newPharmacy.insertId ou une structure adaptée
                  pharmacyId = (newPharmacy as any).insertId || (newPharmacy as any).id;
                } else {
                  pharmacyId = pharmacy[0].id;
                }

                // Sécurité supplémentaire : Un gérant de pharmacie ne peut importer des stocks QUE pour son officine rattachée
                if (ctx.user?.role === "pharmacist" && ctx.user?.pharmacyId !== pharmacyId) {
                  continue; // On ignore silencieusement ou on lève une erreur si la ligne triche sur l'identité
                }

                // 2. Trouver ou créer le Médicament
                let medication = await db.select().from(medications).where(eq(medications.name, row.medication_name)).limit(1);
                let medicationId: number;

                if (medication.length === 0) {
                  const [newMedication] = await db.insert(medications).values({
                    name: row.medication_name,
                    dci: row.medication_dci || null,
                    therapeuticCategory: row.medication_therapeuticCategory || null,
                    dosage: row.medication_dosage || null,
                  });
                  medicationId = (newMedication as any).insertId || (newMedication as any).id;
                } else {
                  medicationId = medication[0].id;
                }

                // 3. Créer ou mettre à jour l'entrée de Stock (Upsert)
                const existingStock = await db.select()
                  .from(stockEntries)
                  .where(
                    and(
                      eq(stockEntries.medicationId, medicationId),
                      eq(stockEntries.pharmacyId, pharmacyId)
                    )
                  )
                  .limit(1);

                const stockStatus = row.stock_status || "available";
                const priceValue = row.stock_price ? parseFloat(row.stock_price).toString() : "0"; 
                // Attention: Dans ton Admin.tsx du routeur principal, le prix est stocké en String/Decimal dans le db.updateStockEntry.
                // Ajuste selon ton type de colonne exact (si ta colonne attend un float pur, retire le .toString())

                if (existingStock.length === 0) {
                  await db.insert(stockEntries).values({
                    medicationId: medicationId,
                    pharmacyId: pharmacyId,
                    status: stockStatus as any,
                    price: priceValue as any,
                    // quantity: row.stock_quantity ? parseInt(row.stock_quantity) : 0, // Optionnel selon ton schema
                  });
                } else {
                  await db.update(stockEntries)
                    .set({
                      status: stockStatus as any,
                      price: priceValue as any,
                      updatedAt: new Date(),
                    })
                    .where(eq(stockEntries.id, existingStock[0].id));
                }
              }

              resolve({ success: true, message: `${results.length} lignes traitées avec succès.` });
            } catch (err) {
              reject(new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erreur lors de l\'injection en base de données.',
                cause: err,
              }));
            }
          })
          .on('error', (error) => {
            console.error('Error parsing CSV:', error);
            reject(new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Échec de la lecture du fichier CSV.',
              cause: error,
            }));
          });
      });
    }),
});

export type DataImportRouter = typeof dataImportRouter;

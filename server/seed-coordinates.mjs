/**
 * Script pour ajouter les coordonnées GPS réelles aux pharmacies
 * Utilise les coordonnées d'Ebolowa, Cameroun comme référence
 * 
 * Coordonnées de base : Ebolowa (2.9065°N, 11.1606°E)
 * 
 * Utilisation : node server/seed-coordinates.mjs
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const PHARMACY_COORDINATES = {
  1: { lat: 2.9065, lng: 11.1606 }, // Centre-ville (référence)
  2: { lat: 2.9120, lng: 11.1650 }, // Quartier nord
  3: { lat: 2.9010, lng: 11.1550 }, // Quartier sud
  4: { lat: 2.9085, lng: 11.1720 }, // Quartier est
  5: { lat: 2.9045, lng: 11.1500 }, // Quartier ouest
  6: { lat: 2.9150, lng: 11.1680 }, // Périphérie nord-est
  7: { lat: 2.8980, lng: 11.1480 }, // Périphérie sud-ouest
};

async function seedCoordinates() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🌍 Ajout des coordonnées GPS aux pharmacies...\n");

    for (const [pharmacyId, coords] of Object.entries(PHARMACY_COORDINATES)) {
      const query = `
        UPDATE pharmacies 
        SET latitude = ?, longitude = ? 
        WHERE id = ?
      `;

      await connection.execute(query, [coords.lat, coords.lng, parseInt(pharmacyId)]);
      console.log(
        `✅ Pharmacie ${pharmacyId}: ${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`
      );
    }

    console.log("\n✨ Coordonnées GPS ajoutées avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout des coordonnées :", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedCoordinates();

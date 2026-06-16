import mysql from 'mysql2/promise';

const createEquasep = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pharma_ebolowa',
  });

  try {
    // 1. Trouver l'ID de la Pharmacie Equasep
    const [pharmacies] = await connection.execute(
      'SELECT id FROM pharmacies WHERE name LIKE ?',
      ['%Equasep%']
    );

    let pharmacyId = null;
    if (pharmacies.length > 0) {
      pharmacyId = pharmacies[0].id;
      console.log(`✓ Pharmacie Equasep trouvée (ID: ${pharmacyId})`);
    } else {
      console.log('! Pharmacie Equasep non trouvée, création en cours...');
      const [result] = await connection.execute(
        'INSERT INTO pharmacies (name, address, phone, email, isOnDuty) VALUES (?, ?, ?, ?, ?)',
        ['Pharmacie Equasep', 'Ebolowa', '+237 000 000 000', 'equasep@pharmacy.cm', false]
      );
      pharmacyId = result.insertId;
      console.log(`✓ Pharmacie Equasep créée (ID: ${pharmacyId})`);
    }

    // 2. Créer l'utilisateur equasep
    const openId = `local-equasep-${Date.now()}`;
    await connection.execute(
      'INSERT INTO users (openId, username, name, password, role, pharmacyId, loginMethod, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [openId, 'equasep', 'Equasep', 'equasep123', 'pharmacist', pharmacyId, 'local', true]
    );

    console.log('✓ Utilisateur "equasep" créé avec succès');
    console.log('✅ Opération terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  } finally {
    await connection.end();
  }
};

createEquasep();

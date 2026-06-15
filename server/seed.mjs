import mysql from 'mysql2/promise';

const seedData = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pharma_ebolowa',
  });

  try {
    // Seed Pharmacies
    const pharmacies = [
      {
        name: 'Pharmacie Equasep',
        address: 'Rue Principale, Ebolowa',
        phone: '+237 690 123 456',
        email: 'equasep@pharmacy.cm',
        openingHours: JSON.stringify({ open: '08:00', close: '20:00' }),
        mapLink: 'https://maps.google.com/?q=Ebolowa+Equasep',
        isOnDuty: true,
      },
      {
        name: 'Pharmacie Samba',
        address: 'Avenue de la Paix, Ebolowa',
        phone: '+237 691 234 567',
        email: 'samba@pharmacy.cm',
        openingHours: JSON.stringify({ open: '08:00', close: '20:00' }),
        mapLink: 'https://maps.google.com/?q=Ebolowa+Samba',
        isOnDuty: false,
      },
      {
        name: 'Pharmacie Renaissance',
        address: 'Quartier Centre, Ebolowa',
        phone: '+237 692 345 678',
        email: 'renaissance@pharmacy.cm',
        openingHours: JSON.stringify({ open: '08:00', close: '20:00' }),
        mapLink: 'https://maps.google.com/?q=Ebolowa+Renaissance',
        isOnDuty: false,
      },
      {
        name: 'Pharmacie Bercail',
        address: 'Rue de la Liberté, Ebolowa',
        phone: '+237 693 456 789',
        email: 'bercail@pharmacy.cm',
        openingHours: JSON.stringify({ open: '08:00', close: '20:00' }),
        mapLink: 'https://maps.google.com/?q=Ebolowa+Bercail',
        isOnDuty: false,
      },
      {
        name: 'Pharmacie Mvila',
        address: 'Quartier Mvila, Ebolowa',
        phone: '+237 694 567 890',
        email: 'mvila@pharmacy.cm',
        openingHours: JSON.stringify({ open: '08:00', close: '20:00' }),
        mapLink: 'https://maps.google.com/?q=Ebolowa+Mvila',
        isOnDuty: false,
      },
      {
        name: 'Pharmacie Élites',
        address: 'Avenue des Élites, Ebolowa',
        phone: '+237 695 678 901',
        email: 'elites@pharmacy.cm',
        openingHours: JSON.stringify({ open: '08:00', close: '20:00' }),
        mapLink: 'https://maps.google.com/?q=Ebolowa+Elites',
        isOnDuty: false,
      },
      {
        name: 'Pharmacie Destinée',
        address: 'Rue de la Destinée, Ebolowa',
        phone: '+237 696 789 012',
        email: 'destinee@pharmacy.cm',
        openingHours: JSON.stringify({ open: '08:00', close: '20:00' }),
        mapLink: 'https://maps.google.com/?q=Ebolowa+Destinee',
        isOnDuty: false,
      },
    ];

    for (const pharmacy of pharmacies) {
      await connection.execute(
        'INSERT INTO pharmacies (name, address, phone, email, openingHours, mapLink, isOnDuty) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          pharmacy.name,
          pharmacy.address,
          pharmacy.phone,
          pharmacy.email,
          pharmacy.openingHours,
          pharmacy.mapLink,
          pharmacy.isOnDuty,
        ]
      );
    }

    console.log('✓ Pharmacies seeded');

    // Seed Medications
    const medications = [
      {
        name: 'Paracétamol 500mg',
        dci: 'Paracétamol',
        therapeuticCategory: 'Analgésique',
        dosage: '500mg',
      },
      {
        name: 'Ibuprofène 400mg',
        dci: 'Ibuprofène',
        therapeuticCategory: 'Anti-inflammatoire',
        dosage: '400mg',
      },
      {
        name: 'Amoxicilline 500mg',
        dci: 'Amoxicilline',
        therapeuticCategory: 'Antibiotique',
        dosage: '500mg',
      },
      {
        name: 'Métronidazole 250mg',
        dci: 'Métronidazole',
        therapeuticCategory: 'Antibiotique',
        dosage: '250mg',
      },
      {
        name: 'Diphenhydramine 25mg',
        dci: 'Diphenhydramine',
        therapeuticCategory: 'Antihistaminique',
        dosage: '25mg',
      },
      {
        name: 'Oméprazole 20mg',
        dci: 'Oméprazole',
        therapeuticCategory: 'Inhibiteur de la pompe à protons',
        dosage: '20mg',
      },
      {
        name: 'Atorvastatine 10mg',
        dci: 'Atorvastatine',
        therapeuticCategory: 'Statine',
        dosage: '10mg',
      },
      {
        name: 'Metformine 500mg',
        dci: 'Metformine',
        therapeuticCategory: 'Antidiabétique',
        dosage: '500mg',
      },
      {
        name: 'Lisinopril 10mg',
        dci: 'Lisinopril',
        therapeuticCategory: 'Inhibiteur de l\'ACE',
        dosage: '10mg',
      },
      {
        name: 'Loratadine 10mg',
        dci: 'Loratadine',
        therapeuticCategory: 'Antihistaminique',
        dosage: '10mg',
      },
    ];

    for (const medication of medications) {
      await connection.execute(
        'INSERT INTO medications (name, dci, therapeuticCategory, dosage) VALUES (?, ?, ?, ?)',
        [
          medication.name,
          medication.dci,
          medication.therapeuticCategory,
          medication.dosage,
        ]
      );
    }

    console.log('✓ Medications seeded');

    // Get all pharmacies and medications
    const [pharmacyRows] = await connection.execute('SELECT id FROM pharmacies');
    const [medicationRows] = await connection.execute('SELECT id FROM medications');

    // Seed Stock Entries
    const statuses = ['available', 'low_stock', 'on_order', 'out_of_stock'];
    const prices = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

    for (const med of medicationRows) {
      for (const pharm of pharmacyRows) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const price = prices[Math.floor(Math.random() * prices.length)];

        await connection.execute(
          'INSERT INTO stockEntries (medicationId, pharmacyId, status, price) VALUES (?, ?, ?, ?)',
          [med.id, pharm.id, status, price]
        );
      }
    }

    console.log('✓ Stock entries seeded');

    // Seed Users (admin and pharmacist)
    await connection.execute(
      'INSERT INTO users (openId, name, email, loginMethod, role, pharmacyId) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin-user', 'Admin User', 'admin@pharmacy.cm', 'local', 'admin', null]
    );

    await connection.execute(
      'INSERT INTO users (openId, name, email, loginMethod, role, pharmacyId) VALUES (?, ?, ?, ?, ?, ?)',
      ['pharmacist-user', 'Pharmacist User', 'pharmacist@pharmacy.cm', 'local', 'pharmacist', 1]
    );

    console.log('✓ Users seeded');
    console.log('\n✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await connection.end();
  }
};

seedData();

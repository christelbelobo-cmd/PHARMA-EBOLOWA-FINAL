import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const createAdmin = async () => {
  const connection = await mysql.createConnection(process.env.DATABASE_URL || 'mysql://root:@localhost:3306/pharma_ebolowa');

  try {
    const username = 'admin_ebolowa';
    const password = 'ChangeMe2026!'; // Mot de passe temporaire
    const openId = `local-admin-${Date.now()}`;

    // Vérifier si l'utilisateur existe déjà
    const [rows] = await connection.execute('SELECT id FROM users WHERE username = ?', [username]);
    
    if (rows.length > 0) {
      await connection.execute(
        'UPDATE users SET password = ?, role = ?, isActive = ? WHERE username = ?',
        [password, 'admin', true, username]
      );
      console.log(`✓ Compte '${username}' mis à jour.`);
    } else {
      await connection.execute(
        'INSERT INTO users (openId, name, username, password, role, loginMethod, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [openId, 'Administrateur', username, password, 'admin', 'local', true]
      );
      console.log(`✓ Compte '${username}' créé avec succès.`);
    }

    console.log('\n--- VOS IDENTIFIANTS ---');
    console.log(`Identifiant : ${username}`);
    console.log(`Mot de passe : ${password}`);
    console.log('------------------------');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await connection.end();
  }
};

createAdmin();

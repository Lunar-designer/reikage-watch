import bcrypt from 'bcryptjs';
import { getDb, saveDatabase, dbRun, dbGet, dbAll } from './database.js';

export async function seed() {
  console.log('Initializing clean Reikage Watch database (Zero fake data)...');
  await getDb();

  const saltRounds = 10;
  const adminHash = await bcrypt.hash('Admin123!', saltRounds);

  // Check if admin user exists, if not create
  const existingAdmin = dbGet("SELECT id FROM users WHERE username = 'reikage_admin'");
  if (!existingAdmin) {
    dbRun(
      `INSERT INTO users (id, username, password_hash, avatar_url, banner_url, bio, clan_rank, role, subscribers_count)
       VALUES ('usr_admin', 'reikage_admin', ?, '/uploads/avatars/avatar_admin.svg', '', 'Reikage Clan Master & Platform Director.', 'Clan Master', 'admin', 0)`,
      [adminHash]
    );
  }

  saveDatabase();
  console.log('Clean database initialized.');
}

if (process.argv[1]?.endsWith('seed.js')) {
  seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}

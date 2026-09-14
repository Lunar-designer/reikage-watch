import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, 'reikage.db');
const jsonStorePath = path.join(__dirname, 'reikage_store.json');

const NEON_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_FkV9t8mGUiQv@ep-muddy-night-b4ho77fb-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

let db = null;
let SQL = null;
let cloudPool = null;

// Initialize connection to Neon PostgreSQL cloud database
try {
  cloudPool = new pg.Pool({
    connectionString: NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 7000
  });
  cloudPool.on('error', (err) => {
    console.warn('Neon cloud pool background error (non-fatal):', err.message);
  });
} catch (e) {
  console.warn('Could not initialize Neon cloud database pool:', e.message);
}

export async function getDb() {
  if (db) return db;

  SQL = await initSqlJs();
  if (fs.existsSync(dbFilePath)) {
    try {
      const fileBuffer = fs.readFileSync(dbFilePath);
      db = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Failed to load binary SQLite, creating fresh in-memory database:', err.message);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  initTables();

  // 1. Initial sync from local backup store
  syncFromLocalStore();

  // 2. Synchronize with Neon Cloud Store for 100% persistent cloud storage
  if (cloudPool) {
    try {
      await initCloudTables();
      const cloudSnapshot = await fetchCloudSnapshot();
      if (cloudSnapshot) {
        console.log('Successfully connected to Neon! Restoring persistent cloud accounts and broadcasts...');
        applySnapshotToDatabase(cloudSnapshot);
        // Save merged data to disk
        saveToDiskOnly();
      } else {
        console.log('Initializing Neon Cloud with current database snapshot...');
        pushSnapshotToCloud();
      }
    } catch (err) {
      console.warn('Neon cloud synchronization notice:', err.message);
    }
  }

  saveDatabase();
  return db;
}

async function initCloudTables() {
  if (!cloudPool) return;
  await cloudPool.query(`
    CREATE TABLE IF NOT EXISTS reikage_cloud_store (
      id VARCHAR(50) PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

async function fetchCloudSnapshot() {
  if (!cloudPool) return null;
  const res = await cloudPool.query("SELECT data FROM reikage_cloud_store WHERE id = 'main_store'");
  if (res.rows && res.rows.length > 0 && res.rows[0].data) {
    return res.rows[0].data;
  }
  return null;
}

function pushSnapshotToCloud() {
  if (!cloudPool || !db) return;
  try {
    const snapshot = generateSnapshot();
    cloudPool.query(
      `INSERT INTO reikage_cloud_store (id, data, updated_at)
       VALUES ('main_store', $1, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [snapshot]
    ).catch(err => {
      console.warn('Neon cloud backup failed:', err.message);
    });
  } catch (err) {
    console.warn('Could not generate snapshot for cloud:', err.message);
  }
}

function generateSnapshot() {
  return {
    users: dbAll('SELECT * FROM users'),
    videos: dbAll('SELECT * FROM videos'),
    comments: dbAll('SELECT * FROM comments'),
    likes: dbAll('SELECT * FROM likes'),
    views_log: dbAll('SELECT * FROM views_log'),
    clan_members: dbAll('SELECT * FROM clan_members'),
    reports: dbAll('SELECT * FROM reports'),
    subscriptions: dbAll('SELECT * FROM subscriptions'),
    updatedAt: new Date().toISOString()
  };
}

function saveToDiskOnly() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
    const snapshot = generateSnapshot();
    fs.writeFileSync(jsonStorePath, JSON.stringify(snapshot, null, 2));
  } catch (err) {
    console.error('Failed to save database to disk:', err);
  }
}

export function saveDatabase() {
  if (!db) return;
  try {
    // 1. Save binary SQLite to local disk
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);

    // 2. Save clean JSON snapshot backup locally
    const snapshot = generateSnapshot();
    fs.writeFileSync(jsonStorePath, JSON.stringify(snapshot, null, 2));

    // 3. Persist to Neon PostgreSQL Cloud asynchronously (never lost on server restart or redeploy)
    pushSnapshotToCloud();
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

function syncFromLocalStore() {
  if (!fs.existsSync(jsonStorePath)) return;
  try {
    const raw = fs.readFileSync(jsonStorePath, 'utf8');
    const store = JSON.parse(raw);
    applySnapshotToDatabase(store);
  } catch (err) {
    console.error('Failed to sync from local store:', err);
  }
}

function applySnapshotToDatabase(store) {
  if (!store || !db) return;

  // Restore users
  if (Array.isArray(store.users)) {
    for (const u of store.users) {
      const exists = dbGet('SELECT id FROM users WHERE id = ?', [u.id]);
      if (!exists) {
        db.run(
          `INSERT OR IGNORE INTO users (id, username, password_hash, avatar_url, banner_url, bio, clan_rank, role, is_banned, subscribers_count, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [u.id, u.username, u.password_hash, u.avatar_url || '', u.banner_url || '', u.bio || '', u.clan_rank || 'Recruit', u.role || 'user', u.is_banned || 0, u.subscribers_count || 0, u.created_at || new Date().toISOString()]
        );
      }
    }
  }

  // Restore videos
  if (Array.isArray(store.videos)) {
    for (const v of store.videos) {
      const exists = dbGet('SELECT id FROM videos WHERE id = ?', [v.id]);
      if (!exists) {
        db.run(
          `INSERT OR IGNORE INTO videos (id, user_id, title, description, video_url, thumbnail_url, category, tags, duration, views_count, likes_count, is_featured, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [v.id, v.user_id, v.title, v.description || '', v.video_url, v.thumbnail_url || '', v.category || 'Highlights', v.tags || '', v.duration || '00:00', v.views_count || 0, v.likes_count || 0, v.is_featured || 0, v.created_at || new Date().toISOString()]
        );
      }
    }
  }

  // Restore clan members
  if (Array.isArray(store.clan_members)) {
    for (const m of store.clan_members) {
      const exists = dbGet('SELECT id FROM clan_members WHERE id = ?', [m.id]);
      if (!exists) {
        db.run(
          `INSERT OR IGNORE INTO clan_members (id, username, role_title, rank_tier, rating, kd_ratio, win_rate, avatar_url, is_staff, order_idx)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [m.id, m.username, m.role_title, m.rank_tier, m.rating || 0, m.kd_ratio || 0.0, m.win_rate || 0, m.avatar_url || '', m.is_staff || 0, m.order_idx || 0]
        );
      }
    }
  }

  // Restore comments
  if (Array.isArray(store.comments)) {
    for (const c of store.comments) {
      const exists = dbGet('SELECT id FROM comments WHERE id = ?', [c.id]);
      if (!exists) {
        db.run(
          `INSERT OR IGNORE INTO comments (id, video_id, user_id, content, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [c.id, c.video_id, c.user_id, c.content, c.created_at || new Date().toISOString()]
        );
      }
    }
  }

  // Restore likes
  if (Array.isArray(store.likes)) {
    for (const l of store.likes) {
      const exists = dbGet('SELECT id FROM likes WHERE id = ?', [l.id]);
      if (!exists) {
        db.run(
          `INSERT OR IGNORE INTO likes (id, video_id, user_id, created_at)
           VALUES (?, ?, ?, ?)`,
          [l.id, l.video_id, l.user_id, l.created_at || new Date().toISOString()]
        );
      }
    }
  }

  // Restore subscriptions
  if (Array.isArray(store.subscriptions)) {
    for (const s of store.subscriptions) {
      const exists = dbGet('SELECT id FROM subscriptions WHERE id = ?', [s.id]);
      if (!exists) {
        db.run(
          `INSERT OR IGNORE INTO subscriptions (id, subscriber_id, channel_id, created_at)
           VALUES (?, ?, ?, ?)`,
          [s.id, s.subscriber_id, s.channel_id, s.created_at || new Date().toISOString()]
        );
      }
    }
  }
}

function initTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT DEFAULT '',
      banner_url TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      clan_rank TEXT DEFAULT 'Recruit',
      role TEXT DEFAULT 'user',
      is_banned INTEGER DEFAULT 0,
      subscribers_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      video_url TEXT NOT NULL,
      thumbnail_url TEXT DEFAULT '',
      category TEXT DEFAULT 'Highlights',
      tags TEXT DEFAULT '',
      duration TEXT DEFAULT '00:00',
      views_count INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(video_id) REFERENCES videos(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(video_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS views_log (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      user_id TEXT DEFAULT NULL,
      viewed_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(reporter_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS clan_members (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      role_title TEXT NOT NULL,
      rank_tier TEXT NOT NULL,
      rating INTEGER DEFAULT 1000,
      kd_ratio REAL DEFAULT 1.5,
      win_rate INTEGER DEFAULT 65,
      avatar_url TEXT DEFAULT '',
      is_staff INTEGER DEFAULT 0,
      order_idx INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      subscriber_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(subscriber_id, channel_id)
    );
  `);
}

// Database helper utilities for easy querying
export function dbAll(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call getDb() first.');
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function dbGet(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call getDb() first.');
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

export function dbRun(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call getDb() first.');
  db.run(sql, params);
  saveDatabase();
  return { success: true };
}

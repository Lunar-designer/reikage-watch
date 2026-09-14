import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, 'reikage.db');
const jsonStorePath = path.join(__dirname, 'reikage_store.json');

let db = null;
let SQL = null;

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
  syncFromBackupStore();
  saveDatabase();

  return db;
}

export function saveDatabase() {
  if (!db) return;
  try {
    // 1. Save binary SQLite to disk
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);

    // 2. Also save clean JSON snapshot backup for 100% reliable persistence
    const snapshot = {
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
    fs.writeFileSync(jsonStorePath, JSON.stringify(snapshot, null, 2));
  } catch (err) {
    console.error('Failed to save database to disk:', err);
  }
}

function syncFromBackupStore() {
  if (!fs.existsSync(jsonStorePath)) return;
  try {
    const raw = fs.readFileSync(jsonStorePath, 'utf8');
    const store = JSON.parse(raw);

    // Restore any missing users
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

    // Restore any missing videos
    if (Array.isArray(store.videos)) {
      for (const v of store.videos) {
        const exists = dbGet('SELECT id FROM videos WHERE id = ?', [v.id]);
        if (!exists) {
          db.run(
            `INSERT OR IGNORE INTO videos (id, user_id, title, description, video_url, thumbnail_url, category, tags, duration, views_count, likes_count, is_featured, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [v.id, v.user_id, v.title, v.description || '', v.video_url, v.thumbnail_url || '', v.category || 'Highlights', v.tags || '', v.duration || '03:15', v.views_count || 0, v.likes_count || 0, v.is_featured || 0, v.created_at || new Date().toISOString()]
          );
        }
      }
    }

    // Restore any missing clan members
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
  } catch (err) {
    console.error('Failed to sync from backup store:', err);
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
      duration TEXT DEFAULT '03:45',
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
      target_type TEXT NOT NULL, -- 'video', 'comment', 'user'
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT DEFAULT '',
      status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
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

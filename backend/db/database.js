import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, 'reikage.db');

let db = null;
let SQL = null;

export async function getDb() {
  if (db) return db;

  SQL = await initSqlJs();
  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    saveDatabase();
  }

  initTables();
  return db;
}

export function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
  } catch (err) {
    console.error('Failed to save database to disk:', err);
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

  saveDatabase();
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

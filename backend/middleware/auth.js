import jwt from 'jsonwebtoken';
import { dbGet } from '../db/database.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'reikage_black_tier_secret_key_2026';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const user = dbGet('SELECT id, username, role, clan_rank, avatar_url, is_banned FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Your account has been suspended by Reikage clan moderation.' });
    }

    req.user = user;
    next();
  });
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    const user = dbGet('SELECT id, username, role, clan_rank, avatar_url, is_banned FROM users WHERE id = ?', [decoded.id]);
    if (user && !user.is_banned) {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  });
}

export function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
      return next();
    }
    return res.status(403).json({ error: 'Access denied. Authorized Reikage staff or admin only.' });
  });
}

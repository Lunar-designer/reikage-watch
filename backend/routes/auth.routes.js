import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun, saveDatabase, saveMediaToCloud } from '../db/database.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';
import { uploadMedia } from '../middleware/upload.js';

const router = express.Router();

// Register new user (no google/gmail required!)
router.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const trimmedUser = username.trim();
    if (trimmedUser.length < 3 || trimmedUser.length > 25) {
      return res.status(400).json({ error: 'Username must be between 3 and 25 characters.' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUser)) {
      return res.status(400).json({ error: 'Username may only contain letters, numbers, and underscores.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const existing = dbGet('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [trimmedUser]);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken. Please choose another.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const defaultAvatar = '/uploads/avatars/avatar_admin.svg';
    const createdAt = new Date().toISOString();

    dbRun(
      `INSERT INTO users (id, username, password_hash, avatar_url, bio, clan_rank, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, trimmedUser, passwordHash, defaultAvatar, 'Reikage Clan Member', 'Recruit', 'user', createdAt]
    );

    await saveDatabase();

    const token = jwt.sign({ id: userId, username: trimmedUser }, JWT_SECRET, { expiresIn: '365d' });

    const newUser = dbGet('SELECT id, username, avatar_url, bio, clan_rank, role, created_at FROM users WHERE id = ?', [userId]);

    res.status(201).json({
      message: 'Account created successfully. Welcome to Reikage Watch.',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = dbGet('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username.trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'This account has been banned by clan moderation.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '365d' });

    const safeUser = {
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      bio: user.bio,
      clan_rank: user.clan_rank,
      role: user.role,
      subscribers_count: user.subscribers_count,
      created_at: user.created_at
    };

    res.json({
      message: 'Login successful.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to sign in.' });
  }
});

// Get current user session
router.get('/me', authenticateToken, (req, res) => {
  const user = dbGet('SELECT id, username, avatar_url, bio, clan_rank, role, subscribers_count, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

// Update profile settings
router.put('/settings', authenticateToken, (req, res) => {
  uploadMedia.single('avatar')(req, res, async (uploadErr) => {
    if (uploadErr) {
      console.warn('Avatar upload warning:', uploadErr.message);
      return res.status(400).json({ error: uploadErr.message || 'Avatar upload failed. Please try a different photo format.' });
    }

    try {
      const { bio, newPassword, currentPassword } = req.body;
      const user = dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      let avatarUrl = user.avatar_url;
      if (req.file) {
        avatarUrl = `/uploads/avatars/${req.file.filename}`;
      }

      const updatedBio = bio !== undefined ? bio.trim().slice(0, 300) : user.bio;

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to set a new password.' });
        }
        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) {
          return res.status(400).json({ error: 'Current password is incorrect.' });
        }
        if (newPassword.length < 6) {
          return res.status(400).json({ error: 'New password must be at least 6 characters.' });
        }
        const newHash = await bcrypt.hash(newPassword, 10);
        dbRun('UPDATE users SET password_hash = ?, bio = ?, avatar_url = ? WHERE id = ?', [newHash, updatedBio, avatarUrl, user.id]);
      } else {
        dbRun('UPDATE users SET bio = ?, avatar_url = ? WHERE id = ?', [updatedBio, avatarUrl, user.id]);
      }

      // If user is also on clan roster, sync avatar there too
      dbRun('UPDATE clan_members SET avatar_url = ? WHERE LOWER(username) = LOWER(?)', [avatarUrl, user.username]);

      // Cloud backup: save avatar into Neon cloud store before returning response
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          const avatarBuffer = fs.readFileSync(req.file.path);
          await saveMediaToCloud(`/avatars/${req.file.filename}`, avatarBuffer, req.file.mimetype || 'image/jpeg');
        } catch (fErr) {
          console.warn('Avatar cloud backup notice:', fErr.message);
        }
      }

      await saveDatabase();

      const updatedUser = dbGet('SELECT id, username, avatar_url, bio, clan_rank, role, subscribers_count, created_at FROM users WHERE id = ?', [user.id]);
      res.json({ message: 'Profile updated successfully.', user: updatedUser });
    } catch (err) {
      console.error('Settings update error:', err);
      res.status(500).json({ error: 'Failed to update profile settings.' });
    }
  });
});

export default router;

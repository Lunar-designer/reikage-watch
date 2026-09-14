import express from 'express';
import { dbAll, dbGet, dbRun } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Submit a new report (video, comment, or user)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { targetType, targetId, reason, details = '' } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ error: 'Target type, target ID, and reason are required.' });
    }

    if (!['video', 'comment', 'user'].includes(targetType)) {
      return res.status(400).json({ error: 'Invalid report target type.' });
    }

    // Check if target exists
    if (targetType === 'video') {
      const v = dbGet('SELECT id FROM videos WHERE id = ?', [targetId]);
      if (!v) return res.status(404).json({ error: 'Reported video not found.' });
    } else if (targetType === 'comment') {
      const c = dbGet('SELECT id FROM comments WHERE id = ?', [targetId]);
      if (!c) return res.status(404).json({ error: 'Reported comment not found.' });
    } else if (targetType === 'user') {
      const u = dbGet('SELECT id FROM users WHERE id = ?', [targetId]);
      if (!u) return res.status(404).json({ error: 'Reported user not found.' });
    }

    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const createdAt = new Date().toISOString();

    dbRun(
      `INSERT INTO reports (id, reporter_id, target_type, target_id, reason, details, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [reportId, req.user.id, targetType, targetId, reason, details.trim().slice(0, 500), createdAt]
    );

    res.status(201).json({
      message: 'Report submitted successfully. The Reikage Clan moderation team has been notified.',
      reportId
    });
  } catch (err) {
    console.error('Submit report error:', err);
    res.status(500).json({ error: 'Failed to submit report.' });
  }
});

export default router;

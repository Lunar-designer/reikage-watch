import express from 'express';
import { dbAll, dbGet, dbRun } from '../db/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get public creator channel
router.get('/:username', optionalAuth, (req, res) => {
  try {
    const username = req.params.username;
    const user = dbGet(
      `SELECT id, username, avatar_url, banner_url, bio, clan_rank, role, subscribers_count, created_at
       FROM users WHERE LOWER(username) = LOWER(?) AND is_banned = 0`,
      [username]
    );

    if (!user) {
      return res.status(404).json({ error: 'Creator channel not found.' });
    }

    // Get all uploaded videos by user
    const videos = dbAll(
      `SELECT v.*, u.username as creator_username, u.avatar_url as creator_avatar, u.clan_rank as creator_rank
       FROM videos v
       JOIN users u ON v.user_id = u.id
       WHERE v.user_id = ?
       ORDER BY v.created_at DESC`,
      [user.id]
    );

    // Compute total views across videos
    const totalViews = videos.reduce((acc, v) => acc + (v.views_count || 0), 0);

    // Check if current user is subscribed
    let isSubscribed = false;
    if (req.user && req.user.id !== user.id) {
      const subRecord = dbGet('SELECT id FROM subscriptions WHERE subscriber_id = ? AND channel_id = ?', [req.user.id, user.id]);
      isSubscribed = !!subRecord;
    }

    res.json({
      channel: {
        ...user,
        totalViews,
        videoCount: videos.length,
        isSubscribed,
        videos
      }
    });
  } catch (err) {
    console.error('Fetch channel error:', err);
    res.status(500).json({ error: 'Failed to retrieve creator channel.' });
  }
});

// Subscribe/Unsubscribe toggle
router.post('/:username/subscribe', authenticateToken, (req, res) => {
  try {
    const targetUser = dbGet('SELECT id, subscribers_count FROM users WHERE LOWER(username) = LOWER(?)', [req.params.username]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot subscribe to your own channel.' });
    }

    const existing = dbGet('SELECT id FROM subscriptions WHERE subscriber_id = ? AND channel_id = ?', [req.user.id, targetUser.id]);

    let isSubscribed = false;
    if (existing) {
      dbRun('DELETE FROM subscriptions WHERE id = ?', [existing.id]);
      dbRun('UPDATE users SET subscribers_count = MAX(0, subscribers_count - 1) WHERE id = ?', [targetUser.id]);
      isSubscribed = false;
    } else {
      const subId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      dbRun('INSERT INTO subscriptions (id, subscriber_id, channel_id) VALUES (?, ?, ?)', [subId, req.user.id, targetUser.id]);
      dbRun('UPDATE users SET subscribers_count = subscribers_count + 1 WHERE id = ?', [targetUser.id]);
      isSubscribed = true;
    }

    const updated = dbGet('SELECT subscribers_count FROM users WHERE id = ?', [targetUser.id]);

    res.json({
      isSubscribed,
      subscribersCount: updated.subscribers_count
    });
  } catch (err) {
    console.error('Subscribe toggle error:', err);
    res.status(500).json({ error: 'Failed to update subscription.' });
  }
});

export default router;

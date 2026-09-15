import express from 'express';
import { dbAll, dbGet, dbRun, deleteVideoCompletely } from '../db/database.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes in this file require staff/admin authorization
router.use(requireAdmin);

// Dashboard overview statistics
router.get('/stats', (req, res) => {
  try {
    const totalUsers = dbGet('SELECT COUNT(*) as count FROM users')?.count || 0;
    const totalVideos = dbGet('SELECT COUNT(*) as count FROM videos')?.count || 0;
    const totalViews = dbGet('SELECT SUM(views_count) as total FROM videos')?.total || 0;
    const totalComments = dbGet('SELECT COUNT(*) as count FROM comments')?.count || 0;
    const pendingReports = dbGet('SELECT COUNT(*) as count FROM reports WHERE status = "pending"')?.count || 0;

    res.json({
      stats: {
        totalUsers,
        totalVideos,
        totalViews,
        totalComments,
        pendingReports
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve admin statistics.' });
  }
});

// List all users
router.get('/users', (req, res) => {
  try {
    const users = dbAll(
      `SELECT id, username, avatar_url, bio, clan_rank, role, is_banned, subscribers_count, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ users });
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ error: 'Failed to fetch users list.' });
  }
});

// Ban or Unban a user
router.put('/users/:id/ban', (req, res) => {
  try {
    const target = dbGet('SELECT id, username, role, is_banned FROM users WHERE id = ?', [req.params.id]);
    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (target.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot ban your own administrator account.' });
    }

    const newBanStatus = target.is_banned ? 0 : 1;
    dbRun('UPDATE users SET is_banned = ? WHERE id = ?', [newBanStatus, target.id]);

    res.json({
      message: newBanStatus ? `Account ${target.username} has been suspended.` : `Account ${target.username} has been unbanned.`,
      is_banned: newBanStatus
    });
  } catch (err) {
    console.error('Admin ban toggle error:', err);
    res.status(500).json({ error: 'Failed to update user ban status.' });
  }
});

// Update user role or clan rank
router.put('/users/:id/role', (req, res) => {
  try {
    const { role, clan_rank } = req.body;
    const target = dbGet('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    if (role && !['user', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    if (role) dbRun('UPDATE users SET role = ? WHERE id = ?', [role, target.id]);
    if (clan_rank) dbRun('UPDATE users SET clan_rank = ? WHERE id = ?', [clan_rank, target.id]);

    res.json({ message: 'User updated successfully.' });
  } catch (err) {
    console.error('Admin update user role error:', err);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// Toggle featured video on homepage banner
router.put('/videos/:id/feature', (req, res) => {
  try {
    const video = dbGet('SELECT id, is_featured, title FROM videos WHERE id = ?', [req.params.id]);
    if (!video) return res.status(404).json({ error: 'Video not found.' });

    const newFeatured = video.is_featured ? 0 : 1;
    // If setting to 1, unfeature other videos so there is a primary featured spotlight
    if (newFeatured === 1) {
      dbRun('UPDATE videos SET is_featured = 0');
    }
    dbRun('UPDATE videos SET is_featured = ? WHERE id = ?', [newFeatured, video.id]);

    res.json({
      message: newFeatured ? `"${video.title}" set as featured banner.` : `Removed from featured banner.`,
      is_featured: newFeatured
    });
  } catch (err) {
    console.error('Admin feature video error:', err);
    res.status(500).json({ error: 'Failed to toggle featured status.' });
  }
});

// List all reports with context
router.get('/reports', (req, res) => {
  try {
    const reports = dbAll(
      `SELECT r.*, u.username as reporter_username
       FROM reports r
       JOIN users u ON r.reporter_id = u.id
       ORDER BY (r.status = 'pending') DESC, r.created_at DESC`
    );

    // Attach target details for convenience
    const enriched = reports.map(r => {
      let targetDetails = null;
      if (r.target_type === 'video') {
        targetDetails = dbGet('SELECT id, title, user_id, video_url FROM videos WHERE id = ?', [r.target_id]);
      } else if (r.target_type === 'comment') {
        targetDetails = dbGet('SELECT id, content, video_id, user_id FROM comments WHERE id = ?', [r.target_id]);
      } else if (r.target_type === 'user') {
        targetDetails = dbGet('SELECT id, username, is_banned FROM users WHERE id = ?', [r.target_id]);
      }
      return { ...r, targetDetails };
    });

    res.json({ reports: enriched });
  } catch (err) {
    console.error('Admin reports error:', err);
    res.status(500).json({ error: 'Failed to retrieve reports.' });
  }
});

// Update report status (resolve or dismiss)
router.put('/reports/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    dbRun('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: `Report marked as ${status}.` });
  } catch (err) {
    console.error('Update report status error:', err);
    res.status(500).json({ error: 'Failed to update report status.' });
  }
});

// Remove video as admin
router.delete('/videos/:id', async (req, res) => {
  try {
    const video = dbGet('SELECT id, title FROM videos WHERE id = ?', [req.params.id]);
    if (!video) return res.status(404).json({ error: 'Video not found.' });

    await deleteVideoCompletely(video.id);

    res.json({ message: `Video "${video.title}" removed by Reikage clan administration.` });
  } catch (err) {
    console.error('Admin delete video error:', err);
    res.status(500).json({ error: 'Failed to remove video.' });
  }
});

// Remove comment as admin
router.delete('/comments/:id', (req, res) => {
  try {
    const comment = dbGet('SELECT id FROM comments WHERE id = ?', [req.params.id]);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    dbRun('DELETE FROM reports WHERE target_type = "comment" AND target_id = ?', [comment.id]);
    dbRun('DELETE FROM comments WHERE id = ?', [comment.id]);

    res.json({ message: 'Comment removed by Reikage clan moderation.' });
  } catch (err) {
    console.error('Admin delete comment error:', err);
    res.status(500).json({ error: 'Failed to remove comment.' });
  }
});

// Clan Leaderboard management
router.post('/leaderboard/member', (req, res) => {
  try {
    const { username, role_title, rank_tier, rating, kd_ratio, win_rate, is_staff = 0 } = req.body;
    if (!username || !role_title) {
      return res.status(400).json({ error: 'Username and role title are required.' });
    }

    const id = `cm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    dbRun(
      `INSERT INTO clan_members (id, username, role_title, rank_tier, rating, kd_ratio, win_rate, avatar_url, is_staff, order_idx)
       VALUES (?, ?, ?, ?, ?, ?, ?, '/uploads/avatars/avatar_admin.svg', ?, 50)`,
      [id, username, role_title, rank_tier || 'Elite Contender', rating || 1500, kd_ratio || 1.5, win_rate || 60, is_staff ? 1 : 0]
    );

    res.status(201).json({ message: 'Clan member added to leaderboard.', id });
  } catch (err) {
    console.error('Add leaderboard member error:', err);
    res.status(500).json({ error: 'Failed to add clan member.' });
  }
});

router.delete('/leaderboard/member/:id', (req, res) => {
  try {
    dbRun('DELETE FROM clan_members WHERE id = ?', [req.params.id]);
    res.json({ message: 'Clan member removed from leaderboard.' });
  } catch (err) {
    console.error('Remove leaderboard member error:', err);
    res.status(500).json({ error: 'Failed to remove clan member.' });
  }
});

export default router;

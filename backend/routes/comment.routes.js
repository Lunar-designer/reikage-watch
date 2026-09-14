import express from 'express';
import { dbAll, dbGet, dbRun } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get comments for a video
router.get('/video/:videoId', (req, res) => {
  try {
    const comments = dbAll(
      `SELECT c.*, u.username, u.avatar_url, u.clan_rank, u.role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.video_id = ?
       ORDER BY c.created_at DESC`,
      [req.params.videoId]
    );

    res.json({ comments });
  } catch (err) {
    console.error('Fetch comments error:', err);
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

// Post a new comment
router.post('/video/:videoId', authenticateToken, (req, res) => {
  try {
    const { content } = req.body;
    const videoId = req.params.videoId;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }

    const trimmed = content.trim();
    if (trimmed.length > 500) {
      return res.status(400).json({ error: 'Comment cannot exceed 500 characters.' });
    }

    const video = dbGet('SELECT id FROM videos WHERE id = ?', [videoId]);
    if (!video) {
      return res.status(404).json({ error: 'Video not found.' });
    }

    const commentId = `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const createdAt = new Date().toISOString();

    dbRun(
      `INSERT INTO comments (id, video_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)`,
      [commentId, videoId, req.user.id, trimmed, createdAt]
    );

    const newComment = dbGet(
      `SELECT c.*, u.username, u.avatar_url, u.clan_rank, u.role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId]
    );

    res.status(201).json({
      message: 'Comment posted.',
      comment: newComment
    });
  } catch (err) {
    console.error('Post comment error:', err);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

// Delete comment (Author or Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const comment = dbGet('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to delete this comment.' });
    }

    dbRun('DELETE FROM reports WHERE target_type = "comment" AND target_id = ?', [comment.id]);
    dbRun('DELETE FROM comments WHERE id = ?', [comment.id]);

    res.json({ message: 'Comment deleted successfully.' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
});

export default router;

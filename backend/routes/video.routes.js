import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbAll, dbGet, dbRun } from '../db/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { uploadMedia } from '../middleware/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// List videos
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, search, sort = 'latest', creator, featured, limit = 50 } = req.query;

    let query = `
      SELECT v.*, u.username as creator_username, u.avatar_url as creator_avatar, u.clan_rank as creator_rank
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE u.is_banned = 0
    `;
    const params = [];

    if (category && category !== 'All') {
      query += ' AND v.category = ?';
      params.push(category);
    }

    if (featured === '1' || featured === 'true') {
      query += ' AND v.is_featured = 1';
    }

    if (creator) {
      query += ' AND LOWER(u.username) = LOWER(?)';
      params.push(creator);
    }

    if (search) {
      query += ' AND (LOWER(v.title) LIKE ? OR LOWER(v.description) LIKE ? OR LOWER(v.tags) LIKE ? OR LOWER(u.username) LIKE ?)';
      const searchPattern = `%${search.toLowerCase()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (sort === 'trending') {
      query += ' ORDER BY (v.views_count * 2 + v.likes_count * 5) DESC, v.created_at DESC';
    } else if (sort === 'views') {
      query += ' ORDER BY v.views_count DESC';
    } else if (sort === 'likes') {
      query += ' ORDER BY v.likes_count DESC';
    } else {
      query += ' ORDER BY v.created_at DESC';
    }

    query += ` LIMIT ${parseInt(limit, 10) || 50}`;

    const videos = dbAll(query, params);
    res.json({ videos });
  } catch (err) {
    console.error('Fetch videos error:', err);
    res.status(500).json({ error: 'Failed to fetch videos.' });
  }
});

// Stream video with HTTP 206 Range support
router.get('/stream/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads/videos', req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video file not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4'
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4'
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Get single video details by ID (with view counting & deduplication)
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const video = dbGet(
      `SELECT v.*, u.username as creator_username, u.avatar_url as creator_avatar, 
              u.clan_rank as creator_rank, u.bio as creator_bio, u.subscribers_count
       FROM videos v
       JOIN users u ON v.user_id = u.id
       WHERE v.id = ?`,
      [req.params.id]
    );

    if (!video) {
      return res.status(404).json({ error: 'Video not found.' });
    }

    // View deduplication logic: 30 minutes cooldown
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userId = req.user ? req.user.id : null;
    const cooldownPeriodMs = 30 * 60 * 1000;
    const now = Date.now();

    const recentView = dbGet(
      `SELECT id FROM views_log 
       WHERE video_id = ? 
         AND (ip_address = ? OR (user_id IS NOT NULL AND user_id = ?))
         AND viewed_at > ?`,
      [video.id, ip, userId, now - cooldownPeriodMs]
    );

    if (!recentView) {
      const viewId = `vw_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      dbRun(
        `INSERT INTO views_log (id, video_id, ip_address, user_id, viewed_at)
         VALUES (?, ?, ?, ?, ?)`,
        [viewId, video.id, ip, userId, now]
      );
      dbRun('UPDATE videos SET views_count = views_count + 1 WHERE id = ?', [video.id]);
      video.views_count += 1;
    }

    // Check if current user liked the video
    let hasLiked = false;
    if (req.user) {
      const likeRecord = dbGet('SELECT id FROM likes WHERE video_id = ? AND user_id = ?', [video.id, req.user.id]);
      hasLiked = !!likeRecord;
    }

    // Check if current user is subscribed to creator
    let isSubscribed = false;
    if (req.user && req.user.id !== video.user_id) {
      const subRecord = dbGet('SELECT id FROM subscriptions WHERE subscriber_id = ? AND channel_id = ?', [req.user.id, video.user_id]);
      isSubscribed = !!subRecord;
    }

    res.json({
      video: {
        ...video,
        hasLiked,
        isSubscribed
      }
    });
  } catch (err) {
    console.error('Get video details error:', err);
    res.status(500).json({ error: 'Failed to retrieve video details.' });
  }
});

// Upload a new video
router.post('/upload', authenticateToken, uploadMedia.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), (req, res) => {
  try {
    const { title, description = '', category = 'Highlights', tags = '', duration = '00:00' } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Video title is required.' });
    }

    if (!req.files || !req.files.video || req.files.video.length === 0) {
      return res.status(400).json({ error: 'Please select a video file to upload.' });
    }

    const videoFile = req.files.video[0];
    const videoUrl = `/uploads/videos/${videoFile.filename}`;

    let thumbnailUrl = '/uploads/thumbnails/thumb_reikage_default.svg';
    if (req.files.thumbnail && req.files.thumbnail.length > 0) {
      thumbnailUrl = `/uploads/thumbnails/${req.files.thumbnail[0].filename}`;
    }

    const videoId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const createdAt = new Date().toISOString();

    dbRun(
      `INSERT INTO videos (id, user_id, title, description, video_url, thumbnail_url, category, tags, duration, views_count, likes_count, is_featured, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)`,
      [
        videoId,
        req.user.id,
        title.trim(),
        description.trim(),
        videoUrl,
        thumbnailUrl,
        category,
        tags.trim(),
        (duration && duration.trim()) || '00:00',
        createdAt
      ]
    );

    const createdVideo = dbGet(
      `SELECT v.*, u.username as creator_username, u.avatar_url as creator_avatar, u.clan_rank as creator_rank
       FROM videos v JOIN users u ON v.user_id = u.id
       WHERE v.id = ?`,
      [videoId]
    );

    res.status(201).json({
      message: 'Video published successfully to Reikage Watch.',
      video: createdVideo
    });
  } catch (err) {
    console.error('Upload video error:', err);
    res.status(500).json({ error: 'Failed to upload video.' });
  }
});

// Like/Unlike toggle
router.post('/:id/like', authenticateToken, (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id;

    const video = dbGet('SELECT id, likes_count FROM videos WHERE id = ?', [videoId]);
    if (!video) {
      return res.status(404).json({ error: 'Video not found.' });
    }

    const existingLike = dbGet('SELECT id FROM likes WHERE video_id = ? AND user_id = ?', [videoId, userId]);

    let hasLiked = false;
    if (existingLike) {
      dbRun('DELETE FROM likes WHERE id = ?', [existingLike.id]);
      dbRun('UPDATE videos SET likes_count = MAX(0, likes_count - 1) WHERE id = ?', [videoId]);
      hasLiked = false;
    } else {
      const likeId = `lk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      dbRun('INSERT INTO likes (id, video_id, user_id) VALUES (?, ?, ?)', [likeId, videoId, userId]);
      dbRun('UPDATE videos SET likes_count = likes_count + 1 WHERE id = ?', [videoId]);
      hasLiked = true;
    }

    const updated = dbGet('SELECT likes_count FROM videos WHERE id = ?', [videoId]);

    res.json({
      hasLiked,
      likesCount: updated.likes_count
    });
  } catch (err) {
    console.error('Like toggle error:', err);
    res.status(500).json({ error: 'Failed to process like.' });
  }
});

// Delete video (Owner or Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const video = dbGet('SELECT * FROM videos WHERE id = ?', [req.params.id]);
    if (!video) {
      return res.status(404).json({ error: 'Video not found.' });
    }

    if (video.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this video.' });
    }

    // Remove comments, likes, reports, and video record
    dbRun('DELETE FROM comments WHERE video_id = ?', [video.id]);
    dbRun('DELETE FROM likes WHERE video_id = ?', [video.id]);
    dbRun('DELETE FROM views_log WHERE video_id = ?', [video.id]);
    dbRun('DELETE FROM reports WHERE target_type = "video" AND target_id = ?', [video.id]);
    dbRun('DELETE FROM videos WHERE id = ?', [video.id]);

    res.json({ message: 'Video removed successfully.' });
  } catch (err) {
    console.error('Delete video error:', err);
    res.status(500).json({ error: 'Failed to delete video.' });
  }
});

export default router;

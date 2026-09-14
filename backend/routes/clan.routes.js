import express from 'express';
import { dbAll, dbGet, dbRun } from '../db/database.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get clan overview and lore
router.get('/info', (req, res) => {
  res.json({
    clan: {
      name: 'REIKAGE',
      tag: '[RK]',
      tagline: 'Watch. Create. Reikage.',
      founded: '2023',
      region: 'Global / North America & Europe',
      motto: 'Shadows strike with absolute precision.',
      bio: 'Reikage is an elite competitive gaming collective and esports organization founded on peak mechanical discipline, tactical supremacy, and relentless tournament ambition. Reikage Watch serves as our private and public arena for match recordings, scrim analysis, and high-octane highlights.',
      stats: {
        totalMembers: 42,
        championshipsWon: 7,
        scrimWinRate: '78.4%',
        discordMembers: 12450
      },
      discordLink: 'https://discord.gg/reikage',
      divisions: [
        { name: 'Valorant Pro Division', status: 'Masters Contender' },
        { name: 'Apex Legends Predator Squad', status: 'ALGS Circuit' },
        { name: 'Counter-Strike 2 Tactical Roster', status: 'Premier Tier' }
      ]
    }
  });
});

// Get clan members roster
router.get('/roster', (req, res) => {
  try {
    const members = dbAll(`SELECT * FROM clan_members ORDER BY order_idx ASC, rating DESC`);
    res.json({ members });
  } catch (err) {
    console.error('Fetch clan roster error:', err);
    res.status(500).json({ error: 'Failed to fetch clan roster.' });
  }
});

// Get clan leaderboard (supports game filter and sorting)
router.get('/leaderboard', (req, res) => {
  try {
    const { sort = 'rating' } = req.query;

    let orderBy = 'rating DESC';
    if (sort === 'kd') orderBy = 'kd_ratio DESC';
    if (sort === 'winrate') orderBy = 'win_rate DESC';

    const leaderboard = dbAll(`SELECT * FROM clan_members ORDER BY ${orderBy}`);
    res.json({ leaderboard });
  } catch (err) {
    console.error('Fetch leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// Extensible integration endpoint: sync or update member stats (for Discord bots or external game API)
router.post('/leaderboard/sync', requireAdmin, (req, res) => {
  try {
    const { members } = req.body;

    if (!Array.isArray(members)) {
      return res.status(400).json({ error: 'Invalid payload: "members" array expected.' });
    }

    for (const m of members) {
      if (!m.username) continue;

      const existing = dbGet('SELECT id FROM clan_members WHERE LOWER(username) = LOWER(?)', [m.username]);

      if (existing) {
        dbRun(
          `UPDATE clan_members 
           SET role_title = COALESCE(?, role_title),
               rank_tier = COALESCE(?, rank_tier),
               rating = COALESCE(?, rating),
               kd_ratio = COALESCE(?, kd_ratio),
               win_rate = COALESCE(?, win_rate)
           WHERE id = ?`,
          [m.role_title, m.rank_tier, m.rating, m.kd_ratio, m.win_rate, existing.id]
        );
      } else {
        const id = `cm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        dbRun(
          `INSERT INTO clan_members (id, username, role_title, rank_tier, rating, kd_ratio, win_rate, avatar_url, is_staff, order_idx)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            m.username,
            m.role_title || 'Clan Contender',
            m.rank_tier || 'Diamond 1',
            m.rating || 1500,
            m.kd_ratio || 1.2,
            m.win_rate || 55,
            m.avatar_url || '/uploads/avatars/avatar_admin.svg',
            m.is_staff ? 1 : 0,
            99
          ]
        );
      }
    }

    res.json({ message: 'Leaderboard updated successfully via API sync.' });
  } catch (err) {
    console.error('Leaderboard sync error:', err);
    res.status(500).json({ error: 'Failed to sync leaderboard.' });
  }
});

export default router;

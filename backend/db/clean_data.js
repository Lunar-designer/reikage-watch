import { getDb, saveDatabase, dbRun, dbAll } from './database.js';

export async function cleanFakeData() {
  console.log('Cleaning all fake preset videos, fake leaderboard, and fake stats...');
  await getDb();

  // 1. Remove fake preset videos (only keep user's actual uploaded videos)
  dbRun(`
    DELETE FROM videos 
    WHERE id IN (
      'vid_grand_finals',
      'vid_lunar_ace',
      'vid_scrim_clutch',
      'vid_vortex_tactics',
      'vid_zenith_reel',
      'vid_shadow_spree'
    )
  `);

  // 2. Remove fake comments
  dbRun(`
    DELETE FROM comments 
    WHERE id IN ('cmt_1', 'cmt_2', 'cmt_3', 'cmt_4')
  `);

  // 3. Remove fake users (keep reikage_admin and lunar)
  dbRun(`
    DELETE FROM users 
    WHERE username IN ('kage_shadow', 'vortex_rk', 'zenith_rk', 'spectre_rk', 'lunar_reikage', 'smoke_user_5961')
  `);

  // 4. Upgrade user's 'lunar' account to admin role so they have full staff privileges
  dbRun(`
    UPDATE users 
    SET role = 'admin', clan_rank = 'Clan Master' 
    WHERE username = 'lunar'
  `);

  // 5. Clean up fake likes and views
  dbRun(`
    DELETE FROM likes 
    WHERE video_id NOT IN (SELECT id FROM videos)
  `);
  dbRun(`
    DELETE FROM views_log 
    WHERE video_id NOT IN (SELECT id FROM videos)
  `);

  // Ensure any remaining user videos have real views/likes (or reset to true counts)
  dbRun(`
    UPDATE videos 
    SET views_count = 0, likes_count = 0 
    WHERE id NOT IN (SELECT video_id FROM views_log)
  `);

  // 6. Clean all fake names from clan_members leaderboard
  dbRun('DELETE FROM clan_members');

  // Insert only real registered members (like lunar) if desired, or leave empty
  const realUsers = dbAll("SELECT id, username, clan_rank FROM users WHERE username = 'lunar'");
  if (realUsers.length > 0) {
    dbRun(`
      INSERT INTO clan_members (id, username, role_title, rank_tier, rating, kd_ratio, win_rate, avatar_url, is_staff, order_idx)
      VALUES (?, ?, 'Clan Master', 'Unranked', 0, 0.0, 0, '/uploads/avatars/avatar_admin.svg', 1, 1)
    `, [`cm_${Date.now()}`, realUsers[0].username]);
  }

  saveDatabase();
  console.log('Successfully cleaned fake data!');
}

cleanFakeData().catch(console.error);

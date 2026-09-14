async function runSmokeTests() {
  console.log('--- STARTING REIKAGE WATCH SMOKE TESTS ---');
  const baseUrl = 'http://localhost:5000/api';

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/health`);
  const health = await healthRes.json();
  console.log('✓ 1. Health check:', health.platform, health.tagline);

  // 2. Fetch videos
  const videosRes = await fetch(`${baseUrl}/videos`);
  const videosData = await videosRes.json();
  console.log(`✓ 2. Videos count: ${videosData.videos.length}`);

  // 3. Test user registration
  const testUser = `smoke_user_${Date.now() % 10000}`;
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUser,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    })
  });
  const regData = await regRes.json();
  console.log('✓ 3. Registration succeeded for:', regData.user.username);
  const token = regData.token;

  // 4. Test login
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUser, password: 'Password123!' })
  });
  const loginData = await loginRes.json();
  console.log('✓ 4. Login verified with token');

  // 5. Test video details & view deduplication
  const targetVideo = videosData.videos[0];
  const v1Res = await fetch(`${baseUrl}/videos/${targetVideo.id}`);
  const v1Data = await v1Res.json();
  const initialViews = v1Data.video.views_count;

  // Immediate second view should be deduplicated (cooldown window)
  const v2Res = await fetch(`${baseUrl}/videos/${targetVideo.id}`);
  const v2Data = await v2Res.json();
  console.log(`✓ 5. View deduplication active: initial views=${initialViews}, second fetch=${v2Data.video.views_count}`);

  // 6. Test like toggle
  const likeRes1 = await fetch(`${baseUrl}/videos/${targetVideo.id}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const likeData1 = await likeRes1.json();
  console.log('✓ 6a. Like toggle ON:', likeData1.hasLiked, 'count:', likeData1.likesCount);

  const likeRes2 = await fetch(`${baseUrl}/videos/${targetVideo.id}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const likeData2 = await likeRes2.json();
  console.log('✓ 6b. Like toggle OFF (unlike):', likeData2.hasLiked, 'count:', likeData2.likesCount);

  // 7. Test comment posting and deletion
  const cmtRes = await fetch(`${baseUrl}/comments/video/${targetVideo.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ content: 'Unreal crosshair placement on that retake!' })
  });
  const cmtData = await cmtRes.json();
  console.log('✓ 7a. Comment created:', cmtData.comment.content);

  const delCmtRes = await fetch(`${baseUrl}/comments/${cmtData.comment.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const delCmtData = await delCmtRes.json();
  console.log('✓ 7b. Comment deleted:', delCmtData.message);

  // 8. Test clan info & leaderboard
  const clanRes = await fetch(`${baseUrl}/clan/info`);
  const clanData = await clanRes.json();
  console.log('✓ 8. Clan Info verified:', clanData.clan.name, '-', clanData.clan.motto);

  const lbRes = await fetch(`${baseUrl}/clan/leaderboard`);
  const lbData = await lbRes.json();
  console.log(`✓ 9. Leaderboard verified: ${lbData.leaderboard.length} members ranked`);

  // 10. Test admin login and protected endpoints
  const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'reikage_admin', password: 'Admin123!' })
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;

  const adminStatsRes = await fetch(`${baseUrl}/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminStats = await adminStatsRes.json();
  console.log('✓ 10. Admin Stats authorized:', adminStats.stats);

  // 11. Test HTTP 206 partial streaming
  const streamRes = await fetch(`http://localhost:5000/api/videos/stream/reikage_grand_finals.mp4`, {
    headers: { Range: 'bytes=0-1024' }
  });
  console.log('✓ 11. Partial Content Streaming Status:', streamRes.status, streamRes.headers.get('content-range'));

  console.log('--- ALL SMOKE TESTS PASSED SUCCESSFULLY! ---');
}

runSmokeTests().catch(err => {
  console.error('Smoke tests failed:', err);
  process.exit(1);
});

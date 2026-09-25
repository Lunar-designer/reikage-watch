import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, Users, Video, AlertTriangle, Check, 
  Trash2, Star, Ban, UserCheck, Plus, RefreshCw 
} from 'lucide-react';
import { formatTimeAgo, parseUtcDate } from '../utils/dateUtils';

export default function AdminPage({ onSelectVideo, onSelectCreator }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('reports'); // 'reports', 'users', 'videos', 'leaderboard'
  const [reports, setReports] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [videosList, setVideosList] = useState([]);
  const [leaderboardList, setLeaderboardList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  // New leaderboard member form
  const [newLbUser, setNewLbUser] = useState('');
  const [newLbRole, setNewLbRole] = useState('Clan Contender');
  const [newLbTier, setNewLbTier] = useState('Immortal 1');
  const [newLbRating, setNewLbRating] = useState(2000);
  const [newLbKd, setNewLbKd] = useState(1.8);
  const [newLbWin, setNewLbWin] = useState(65);

  const isAuthorized = user && (user.role === 'admin' || user.role === 'staff');

  useEffect(() => {
    if (isAuthorized) {
      loadAllAdminData();
    }
  }, [isAuthorized]);

  async function loadAllAdminData() {
    setLoading(true);
    try {
      const [sData, rData, uData, vData, lData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminReports(),
        api.getAdminUsers(),
        api.getVideos({ limit: 100 }),
        api.getLeaderboard()
      ]);

      if (sData) setStats(sData.stats);
      if (rData) setReports(rData.reports);
      if (uData) setUsersList(uData.users);
      if (vData) setVideosList(vData.videos);
      if (lData) setLeaderboardList(lData.leaderboard);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  const showFeedback = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  // Report actions
  const handleUpdateReport = async (reportId, status) => {
    try {
      await api.updateReportStatus(reportId, status);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
      showFeedback(`Report marked as ${status}.`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Ban toggle
  const handleToggleBan = async (userId) => {
    try {
      const res = await api.toggleUserBan(userId);
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, is_banned: res.is_banned } : u));
      showFeedback(res.message);
    } catch (err) {
      alert(err.message);
    }
  };

  // Feature video toggle
  const handleToggleFeature = async (videoId) => {
    try {
      const res = await api.toggleFeatureVideo(videoId);
      setVideosList(prev => prev.map(v => ({
        ...v,
        is_featured: v.id === videoId ? res.is_featured : (res.is_featured ? 0 : v.is_featured)
      })));
      showFeedback(res.message);
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete video
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Permanently remove this video from Reikage Watch?')) return;
    try {
      await api.adminDeleteVideo(videoId);
      setVideosList(prev => prev.filter(v => v.id !== videoId));
      showFeedback('Video removed by moderation.');
    } catch (err) {
      alert(err.message);
    }
  };

  // Add leaderboard member
  const handleAddLbMember = async (e) => {
    e.preventDefault();
    try {
      await api.addLeaderboardMember({
        username: newLbUser,
        role_title: newLbRole,
        rank_tier: newLbTier,
        rating: parseInt(newLbRating, 10),
        kd_ratio: parseFloat(newLbKd),
        win_rate: parseInt(newLbWin, 10)
      });
      showFeedback(`Member ${newLbUser} added to leaderboard.`);
      setNewLbUser('');
      const lData = await api.getLeaderboard();
      if (lData) setLeaderboardList(lData.leaderboard);
    } catch (err) {
      alert(err.message);
    }
  };

  // Remove leaderboard member
  const handleRemoveLbMember = async (id) => {
    if (!window.confirm('Remove from clan leaderboard?')) return;
    try {
      await api.removeLeaderboardMember(id);
      setLeaderboardList(prev => prev.filter(m => m.id !== id));
      showFeedback('Removed from leaderboard.');
    } catch (err) {
      alert(err.message);
    }
  };

  if (!isAuthorized) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', maxWidth: '500px', margin: '0 auto' }}>
        <Shield size={56} color="#ffffff" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
        <h2 style={{ fontSize: '24px', fontWeight: 900 }}>ACCESS RESTRICTED</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          This command panel is restricted to authorized Reikage Clan staff and administrators.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={26} color="#ffffff" />
            <h1 style={{ fontSize: '28px', fontWeight: 900 }}>REIKAGE CLAN COMMAND DASHBOARD</h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Logged in as Reikage Staff: <strong style={{ color: '#fff' }}>{user.username}</strong> ({user.clan_rank})
          </p>
        </div>

        <button className="btn btn-secondary" onClick={loadAllAdminData}>
          <RefreshCw size={15} /> Refresh System
        </button>
      </div>

      {actionMsg && (
        <div style={{ padding: '12px 18px', background: '#0e1f12', border: '1px solid #1a4022', color: '#69db7c', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontWeight: 700 }}>
          {actionMsg}
        </div>
      )}

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>TOTAL CLAN USERS</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
            {stats?.totalUsers || 0}
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>PUBLISHED MATCHES</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
            {stats?.totalVideos || 0}
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>TOTAL BROADCAST VIEWS</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
            {stats?.totalViews?.toLocaleString() || 0}
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>PENDING REPORTS</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: stats?.pendingReports > 0 ? '#ff6b6b' : '#fff', marginTop: '4px' }}>
            {stats?.pendingReports || 0}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-dim)', marginBottom: '24px', paddingBottom: '10px' }}>
        <button
          className={`category-chip ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports Queue ({reports.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={`category-chip ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Clan Accounts ({usersList.length})
        </button>
        <button
          className={`category-chip ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          Match Reels ({videosList.length})
        </button>
        <button
          className={`category-chip ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard Registry ({leaderboardList.length})
        </button>
      </div>

      {/* Tab 1: Moderation Reports */}
      {activeTab === 'reports' && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '16px' }}>REPORTED CONTENT QUEUE</h2>
          {reports.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              No reports filed. The community is clean!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-reikage">{rep.target_type.toUpperCase()}</span>
                      <span className="badge" style={{ color: rep.status === 'pending' ? '#ff6b6b' : '#69db7c' }}>
                        {rep.status.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Reported by @{rep.reporter_username} • {formatTimeAgo(rep.created_at)}
                    </span>
                  </div>

                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                    Reason: {rep.reason}
                  </div>
                  {rep.details && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Context: {rep.details}
                    </div>
                  )}

                  {/* Target item preview */}
                  {rep.targetDetails && (
                    <div style={{ padding: '10px 14px', background: '#0a0a0a', borderRadius: 'var(--radius-sm)', marginBottom: '14px', fontSize: '12.5px', border: '1px solid var(--border-dim)' }}>
                      Target preview: <strong style={{ color: '#fff' }}>{rep.targetDetails.title || rep.targetDetails.content || rep.targetDetails.username}</strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {rep.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '12px', padding: '6px 14px' }}
                          onClick={() => handleUpdateReport(rep.id, 'resolved')}
                        >
                          <Check size={14} /> Resolve & Close
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '12px', padding: '6px 14px' }}
                          onClick={() => handleUpdateReport(rep.id, 'dismissed')}
                        >
                          Dismiss (No Violation)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User Accounts */}
      {activeTab === 'users' && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0d0d0d', borderBottom: '1px solid var(--border-dim)' }}>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>USER</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>ROLE</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>CLAN RANK</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>STATUS</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={u.avatar_url || '/uploads/avatars/avatar_admin.svg'}
                        alt={u.username}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/uploads/avatars/avatar_admin.svg'; }}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', aspectRatio: '1 / 1', flexShrink: 0 }}
                      />
                      <div style={{ fontWeight: 800, color: '#fff', fontSize: '13.5px' }}>{u.username}</div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge">{u.role}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#fff' }}>
                    {u.clan_rank}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {u.is_banned ? (
                      <span className="badge" style={{ background: '#301010', color: '#ff6b6b' }}>BANNED</span>
                    ) : (
                      <span className="badge" style={{ background: '#102410', color: '#69db7c' }}>ACTIVE</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {u.id !== user.id && (
                      <button
                        className={`btn ${u.is_banned ? 'btn-secondary' : 'btn-danger'}`}
                        style={{ fontSize: '11.5px', padding: '6px 12px' }}
                        onClick={() => handleToggleBan(u.id)}
                      >
                        {u.is_banned ? 'Unban Account' : 'Suspend Account'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Match Videos */}
      {activeTab === 'videos' && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0d0d0d', borderBottom: '1px solid var(--border-dim)' }}>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>MATCH TITLE</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>CREATOR</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>CATEGORY</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>VIEWS</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>SPOTLIGHT</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {videosList.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: '#fff', fontSize: '13.5px', maxWidth: '300px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.title}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {v.creator_username}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge">{v.category}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#fff' }}>
                    {v.views_count?.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      className={`btn ${v.is_featured ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '11.5px', padding: '6px 12px' }}
                      onClick={() => handleToggleFeature(v.id)}
                    >
                      <Star size={13} fill={v.is_featured ? '#000' : 'none'} />
                      {v.is_featured ? 'Featured Hero' : 'Set as Hero'}
                    </button>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: '11.5px', padding: '6px 12px' }}
                      onClick={() => handleDeleteVideo(v.id)}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Leaderboard Registry */}
      {activeTab === 'leaderboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0d0d0d', borderBottom: '1px solid var(--border-dim)' }}>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>MEMBER</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>ROLE</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>MMR</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>K/D</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardList.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#fff' }}>{m.username}</td>
                    <td style={{ padding: '14px 16px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>{m.role_title}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#fff' }}>{m.rating}</td>
                    <td style={{ padding: '14px 16px', color: '#fff' }}>{m.kd_ratio?.toFixed(2)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        className="btn btn-danger"
                        style={{ fontSize: '11px', padding: '5px 10px' }}
                        onClick={() => handleRemoveLbMember(m.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add member form */}
          <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', height: 'fit-content' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '16px' }}>ADD TO LEADERBOARD</h3>
            <form onSubmit={handleAddLbMember} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>USERNAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. shadow_fragger"
                  value={newLbUser}
                  onChange={(e) => setNewLbUser(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>ROLE TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sentinel Anchor"
                  value={newLbRole}
                  onChange={(e) => setNewLbRole(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>RATING (MMR)</label>
                  <input
                    type="number"
                    value={newLbRating}
                    onChange={(e) => setNewLbRating(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>K/D RATIO</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newLbKd}
                    onChange={(e) => setNewLbKd(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', padding: '10px' }}>
                <Plus size={16} /> Add Member
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

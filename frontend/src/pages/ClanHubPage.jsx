import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Trophy, Shield, Swords, Users, ExternalLink, 
  Flame, Zap, CheckCircle, Plus 
} from 'lucide-react';

export default function ClanHubPage({ onSelectCreator }) {
  const [clanInfo, setClanInfo] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [sortBy, setSortBy] = useState('rating');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClanData() {
      setLoading(true);
      try {
        const infoData = await api.getClanInfo();
        if (infoData && infoData.clan) {
          setClanInfo(infoData.clan);
        }

        const lbData = await api.getLeaderboard(sortBy);
        if (lbData && lbData.leaderboard) {
          setLeaderboard(lbData.leaderboard);
        }
      } catch (err) {
        console.error('Failed to load clan data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadClanData();
  }, [sortBy]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* Clan Hero Banner */}
      <div
        style={{
          position: 'relative',
          padding: '44px 36px',
          background: 'linear-gradient(180deg, #0e0e0e 0%, #060606 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '36px',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '820px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span className="badge badge-reikage" style={{ padding: '4px 10px' }}>
              <Trophy size={13} /> REIKAGE CLAN ARENA
            </span>
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '12px' }}>
            REIKAGE // WATCH. CREATE. REIKAGE.
          </h1>

          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
            The central hub for the Reikage gaming clan. Track roster standings, competitive rankings, and match broadcasts.
          </p>

          {/* Clean Clan Metrics */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>REGISTERED MEMBERS</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>
                {leaderboard.length > 0 ? leaderboard.length : 1} Active
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>SEASON STATUS</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>Live</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>PLATFORM</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>Reikage Watch</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Leaderboard & Community */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', gap: '32px' }}>
        {/* Clan Leaderboard Section */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={22} color="#ffffff" />
              <h2 style={{ fontSize: '20px', fontWeight: 900 }}>REIKAGE CLAN LEADERBOARD</h2>
            </div>

            {leaderboard.length > 0 && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`category-chip ${sortBy === 'rating' ? 'active' : ''}`}
                  style={{ fontSize: '12px', padding: '5px 12px' }}
                  onClick={() => setSortBy('rating')}
                >
                  Rating
                </button>
                <button
                  className={`category-chip ${sortBy === 'kd' ? 'active' : ''}`}
                  style={{ fontSize: '12px', padding: '5px 12px' }}
                  onClick={() => setSortBy('kd')}
                >
                  K/D
                </button>
                <button
                  className={`category-chip ${sortBy === 'winrate' ? 'active' : ''}`}
                  style={{ fontSize: '12px', padding: '5px 12px' }}
                  onClick={() => setSortBy('winrate')}
                >
                  Win %
                </button>
              </div>
            )}
          </div>

          {leaderboard.length === 0 ? (
            <div
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                padding: '48px 24px',
                textAlign: 'center'
              }}
            >
              <Trophy size={40} color="#666" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 900 }}>AWAITING VERIFIED SEASON MATCHES</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '8px auto 20px auto' }}>
                No clan members have been placed on the competitive leaderboard yet. Register an account, upload match vods, or have clan staff add roster ranks.
              </p>
              <a href="#/upload" className="btn btn-primary" style={{ padding: '10px 20px' }}>
                Upload Match Footage
              </a>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#0d0d0d', borderBottom: '1px solid var(--border-dim)' }}>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>RANK</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>MEMBER</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>TIER</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>RATING</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>K/D</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>WIN %</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((member, idx) => (
                    <tr
                      key={member.id}
                      style={{
                        borderBottom: '1px solid var(--border-dim)',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onClick={() => onSelectCreator(member.username)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#181818')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 900, color: '#ffffff' }}>
                        #{idx + 1}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={member.avatar_url || '/uploads/avatars/avatar_admin.svg'}
                            alt={member.username}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/uploads/avatars/avatar_admin.svg'; }}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', aspectRatio: '1 / 1', flexShrink: 0, border: '1px solid var(--border-medium)' }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#fff' }}>
                              {member.username}
                              {member.is_staff === 1 && (
                                <span className="badge badge-staff" style={{ marginLeft: '6px' }}>
                                  STAFF
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {member.role_title}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge" style={{ fontSize: '10px', background: '#000' }}>
                          {member.rank_tier || 'Member'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#ffffff' }}>
                        {member.rating || 0}
                      </td>

                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#ffffff' }}>
                        {member.kd_ratio?.toFixed(2) || '0.00'}
                      </td>

                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#ffffff' }}>
                        {member.win_rate || 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
            * Standings can be managed by clan staff via the Admin Dashboard or synced with the Reikage API webhook.
          </div>
        </section>

        {/* Community & Discord Widget Card */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Discord Card */}
          <div
            style={{
              background: '#0d0d0d',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Users size={20} color="#000000" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 900 }}>REIKAGE DISCORD</h3>
                <span style={{ fontSize: '11px', color: '#69db7c', fontWeight: 700 }}>
                  ● Community Discord
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Join the official Reikage Clan Discord for scrim scheduling, voice channels, and tournament announcements.
            </p>

            <a
              href="https://discord.gg/XPzSv9eWvg"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              Join Reikage Discord <ExternalLink size={14} />
            </a>
          </div>

          {/* Clan Competitive Divisions */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '24px'
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Swords size={18} color="#ffffff" /> COMPETITIVE DIVISIONS
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', background: '#0a0a0a', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dim)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '13px' }}>Valorant Division</span>
                  <span className="badge badge-reikage">Active</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Competitive 5-man roster & scrims
                </div>
              </div>

              <div style={{ padding: '12px', background: '#0a0a0a', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dim)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '13px' }}>Apex Legends Squad</span>
                  <span className="badge badge-reikage">Active</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Ranked predator squad
                </div>
              </div>

              <div style={{ padding: '12px', background: '#0a0a0a', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dim)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '13px' }}>Counter-Strike 2 Division</span>
                  <span className="badge badge-reikage">Active</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Tactical Premier scrim team
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

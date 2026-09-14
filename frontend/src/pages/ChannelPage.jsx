import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import ReportModal from '../components/ReportModal';
import { parseUtcDate } from '../utils/dateUtils';
import { 
  UserCheck, UserPlus, Upload, Settings, Eye, 
  Video as VideoIcon, Calendar, Flag, Shield 
} from 'lucide-react';

export default function ChannelPage({ username, onSelectVideo, onNavigate }) {
  const { user, openAuthModal } = useAuth();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    async function loadChannel() {
      setLoading(true);
      try {
        const data = await api.getChannel(username);
        if (data && data.channel) {
          setChannel(data.channel);
        }
      } catch (err) {
        console.error('Failed to load channel:', err);
      } finally {
        setLoading(false);
      }
    }
    if (username) {
      loadChannel();
    }
  }, [username]);

  const handleSubscribeToggle = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await api.toggleSubscribe(channel.username);
      setChannel(prev => ({
        ...prev,
        isSubscribed: res.isSubscribed,
        subscribers_count: res.subscribersCount
      }));
    } catch (err) {
      console.error('Subscribe error:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '15px', fontWeight: 800 }}>FETCHING REIKAGE CREATOR PROFILE...</div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Creator Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          No Reikage member found with the username "{username}".
        </p>
      </div>
    );
  }

  const isOwnChannel = user && user.id === channel.id;

  return (
    <div className="channel-page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Channel Header Banner */}
      <div
        className="channel-banner"
        style={{
          position: 'relative',
          width: '100%',
          height: '180px',
          background: 'linear-gradient(90deg, #101010 0%, #1e1e1e 50%, #0d0d0d 100%)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '32px'
        }}
      >
        <div style={{ opacity: 0.1, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '72px', letterSpacing: '0.1em' }}>
          REIKAGE
        </div>
      </div>

      {/* Creator Profile Info Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          padding: '0 24px',
          marginTop: '-44px',
          marginBottom: '28px',
          position: 'relative',
          zIndex: 2
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
          <img
            src={channel.avatar_url || '/uploads/avatars/avatar_admin.svg'}
            alt={channel.username}
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              border: '3px solid #070707',
              boxShadow: 'var(--shadow-md)',
              background: '#161616',
              objectFit: 'cover'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 900 }}>{channel.username}</h1>
              <span className="badge badge-reikage">{channel.clan_rank || 'Pro Member'}</span>
              {channel.role === 'admin' && (
                <span className="badge badge-staff">
                  <Shield size={12} /> Clan Admin
                </span>
              )}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              <span>@{channel.username}</span>
              <span style={{ margin: '0 8px' }}>•</span>
              <span>{channel.subscribers_count?.toLocaleString() || 0} followers</span>
              <span style={{ margin: '0 8px' }}>•</span>
              <span>{channel.videoCount || 0} uploads</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {isOwnChannel ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => onNavigate('settings')}
              >
                <Settings size={16} /> Customize Profile
              </button>
              <button
                className="btn btn-primary"
                onClick={() => onNavigate('upload')}
              >
                <Upload size={16} /> Upload Video
              </button>
            </>
          ) : (
            <>
              <button
                className={`btn ${channel.isSubscribed ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleSubscribeToggle}
                style={{ borderRadius: 'var(--radius-full)', padding: '10px 22px' }}
              >
                {channel.isSubscribed ? (
                  <>
                    <UserCheck size={16} /> Following
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Follow Creator
                  </>
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setReportOpen(true)}
                title="Report channel"
              >
                <Flag size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          borderBottom: '1px solid var(--border-dim)',
          marginBottom: '28px',
          padding: '0 12px'
        }}
      >
        <button
          className="btn-ghost"
          style={{
            padding: '12px 4px',
            fontWeight: 800,
            fontSize: '14px',
            color: activeTab === 'videos' ? '#fff' : 'var(--text-secondary)',
            borderBottom: activeTab === 'videos' ? '2px solid #fff' : '2px solid transparent'
          }}
          onClick={() => setActiveTab('videos')}
        >
          VIDEOS ({channel.videoCount || 0})
        </button>

        <button
          className="btn-ghost"
          style={{
            padding: '12px 4px',
            fontWeight: 800,
            fontSize: '14px',
            color: activeTab === 'about' ? '#fff' : 'var(--text-secondary)',
            borderBottom: activeTab === 'about' ? '2px solid #fff' : '2px solid transparent'
          }}
          onClick={() => setActiveTab('about')}
        >
          ABOUT
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'videos' ? (
        channel.videos && channel.videos.length > 0 ? (
          <div className="video-grid">
            {channel.videos.map((vid) => (
              <VideoCard
                key={vid.id}
                video={vid}
                onSelectVideo={onSelectVideo}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
            <VideoIcon size={44} color="#666" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>No videos uploaded yet</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {channel.username} hasn't uploaded any match recordings.
            </p>
          </div>
        )
      ) : (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '28px',
            maxWidth: '780px'
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px' }}>Description & Bio</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {channel.bio || 'No bio written for this clan member.'}
          </p>

          <div style={{ borderTop: '1px solid var(--border-dim)', marginTop: '24px', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px' }}>Channel Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL VIEWS</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                  {channel.totalViews?.toLocaleString() || 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JOINED REIKAGE</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                  {parseUtcDate(channel.created_at).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CLAN TIER</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                  {channel.clan_rank || 'Contender'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="user"
        targetId={channel.id}
        targetTitle={`Account @${channel.username}`}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import VideoCard from '../components/VideoCard';
import { Search, User, Video as VideoIcon, ArrowRight } from 'lucide-react';

export default function SearchPage({ query, onSelectVideo, onSelectCreator }) {
  const [videos, setVideos] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'videos', 'creators'

  useEffect(() => {
    async function executeSearch() {
      if (!query) return;
      setLoading(true);
      try {
        const data = await api.getVideos({ search: query });
        if (data && data.videos) {
          setVideos(data.videos);

          // Extract distinct matching creators
          const creatorMap = new Map();
          data.videos.forEach(v => {
            if (!creatorMap.has(v.creator_username)) {
              creatorMap.set(v.creator_username, {
                username: v.creator_username,
                avatar_url: v.creator_avatar,
                clan_rank: v.creator_rank,
                videoCount: 1
              });
            } else {
              creatorMap.get(v.creator_username).videoCount += 1;
            }
          });
          setCreators(Array.from(creatorMap.values()));
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }
    executeSearch();
  }, [query]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Search size={24} color="#ffffff" />
        <h1 style={{ fontSize: '24px', fontWeight: 900 }}>
          Search results for: <span style={{ color: '#fff' }}>"{query}"</span>
        </h1>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', borderBottom: '1px solid var(--border-dim)', paddingBottom: '12px' }}>
        <button
          className={`category-chip ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          All ({videos.length + creators.length})
        </button>
        <button
          className={`category-chip ${filterType === 'videos' ? 'active' : ''}`}
          onClick={() => setFilterType('videos')}
        >
          Videos ({videos.length})
        </button>
        <button
          className={`category-chip ${filterType === 'creators' ? 'active' : ''}`}
          onClick={() => setFilterType('creators')}
        >
          Clan Creators ({creators.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="reikage-spinner-white" style={{ width: '42px', height: '42px', marginBottom: '16px' }} />
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', letterSpacing: '2px' }}>
            SEARCHING REIKAGE ARCHIVES...
          </div>
        </div>
      ) : videos.length === 0 && creators.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
          <Search size={44} color="#666" style={{ margin: '0 auto 12px auto' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>No results found for "{query}"</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
            Try searching for terms like "finals", "lunar", "scrim", "ace", "tactics", or "#valorant".
          </p>
        </div>
      ) : (
        <>
          {/* Creators Section */}
          {(filterType === 'all' || filterType === 'creators') && creators.length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px', color: 'var(--text-secondary)' }}>
                MATCHING REIKAGE CREATORS
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {creators.map(c => (
                  <div
                    key={c.username}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 18px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s'
                    }}
                    onClick={() => onSelectCreator(c.username)}
                  >
                    <img
                      src={c.avatar_url || '/uploads/avatars/avatar_admin.svg'}
                      alt={c.username}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/uploads/avatars/avatar_admin.svg'; }}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', aspectRatio: '1 / 1', flexShrink: 0, border: '1.5px solid #fff' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#fff' }}>{c.username}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.clan_rank || 'Pro Member'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.videoCount} uploaded videos</div>
                    </div>
                    <ArrowRight size={16} color="var(--text-muted)" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos Section */}
          {(filterType === 'all' || filterType === 'videos') && (
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px', color: 'var(--text-secondary)' }}>
                VIDEOS & MATCH FOOTAGE
              </h2>
              <div className="video-grid">
                {videos.map(video => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onSelectVideo={onSelectVideo}
                    onSelectCreator={onSelectCreator}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

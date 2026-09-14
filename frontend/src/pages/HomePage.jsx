import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import VideoCard from '../components/VideoCard';
import HeroBanner from '../components/HeroBanner';
import { Trophy, Upload, Shield, Play, Flame, Disc as DiscordIcon, Sparkles } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Clan Wars',
  'Montages',
  'Scrims',
  'Tactics & Guides',
  'Highlights'
];

export default function HomePage({ onSelectVideo, onSelectCreator, onNavigate }) {
  const [videos, setVideos] = useState([]);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      try {
        const params = {};
        if (selectedCategory !== 'All') {
          params.category = selectedCategory;
        }
        const data = await api.getVideos(params);
        if (data && data.videos) {
          setVideos(data.videos);
          const featured = data.videos.find(v => v.is_featured === 1);
          setFeaturedVideo(featured || null);
        }
      } catch (err) {
        console.error('Failed to load home feed:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, [selectedCategory]);

  return (
    <div className="home-page-container">
      {/* Category Filter Chips Bar */}
      <div className="category-chips-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Hero Banner: If an admin featured a video, show it; otherwise show clean Clan Welcome Hero */}
      {selectedCategory === 'All' && (
        featuredVideo ? (
          <HeroBanner featuredVideo={featuredVideo} onWatch={onSelectVideo} />
        ) : (
          <div
            className="hero-spotlight"
            style={{
              background: 'linear-gradient(135deg, #0d0d0d 0%, #171717 50%, #080808 100%)',
              border: '1px solid var(--border-medium)',
              padding: '44px 36px',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}
          >
            <div className="hero-content" style={{ maxWidth: '780px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span className="badge badge-reikage" style={{ padding: '4px 10px' }}>
                  <Trophy size={13} /> OFFICIAL CLAN PLATFORM
                </span>
              </div>

              <h1 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '10px' }}>
                REIKAGE WATCH
              </h1>

              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '22px' }}>
                The official video-sharing platform for the Reikage gaming clan. Share competitive scrims, tournament vods, and clutch mechanical highlights with the clan.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href="#/upload"
                  className="btn btn-primary"
                  style={{ padding: '12px 22px', fontSize: '14px' }}
                >
                  <Upload size={17} /> Upload Match Video
                </a>
                <a
                  href="#/clan"
                  className="btn btn-secondary"
                  style={{ padding: '12px 20px', fontSize: '14px' }}
                >
                  <Trophy size={17} /> Clan Roster & Standings
                </a>
              </div>
            </div>
          </div>
        )
      )}

      {/* Videos Section */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="reikage-spinner-white" style={{ width: '42px', height: '42px', marginBottom: '16px' }} />
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', letterSpacing: '1.5px' }}>
            LOADING REIKAGE BROADCASTS...
          </div>
        </div>
      ) : videos.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '70px 20px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            maxWidth: '680px',
            margin: '20px auto'
          }}
        >
          <Trophy size={46} color="#ffffff" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
          <h2 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.02em' }}>
            NO BROADCASTS PUBLISHED YET
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '8px', marginBottom: '22px' }}>
            {selectedCategory === 'All'
              ? 'The arena is clean and ready. Upload the first match video or scrimmage to start the season reel.'
              : `No videos found under the "${selectedCategory}" category.`}
          </p>
          <a
            href="#/upload"
            className="btn btn-primary"
            style={{ padding: '12px 24px' }}
          >
            <Upload size={16} /> Upload First Video
          </a>
        </div>
      ) : (
        <section style={{ marginTop: selectedCategory === 'All' ? '12px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} color="#ffffff" />
              <h2 style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '0.02em' }}>
                {selectedCategory === 'All' ? 'CLAN BROADCASTS' : `${selectedCategory.toUpperCase()} BROADCASTS`}
              </h2>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {videos.length} {videos.length === 1 ? 'match' : 'matches'} available
            </span>
          </div>

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
        </section>
      )}
    </div>
  );
}

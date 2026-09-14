import React from 'react';
import { Play, Flame, Shield, Trophy } from 'lucide-react';

export default function HeroBanner({ featuredVideo, onWatch }) {
  if (!featuredVideo) return null;

  return (
    <div className="hero-spotlight">
      <img
        src={featuredVideo.thumbnail_url || '/uploads/thumbnails/thumb_reikage_default.svg'}
        alt={featuredVideo.title}
        className="hero-backdrop-img"
      />
      <div className="hero-gradient-overlay" />

      <div className="hero-content">
        <div className="hero-badges">
          <span className="badge badge-reikage">
            <Trophy size={12} /> REIKAGE SPOTLIGHT
          </span>
          <span className="badge">
            <Flame size={12} /> CLAN FEATURED
          </span>
          <span className="badge">1080P 60FPS</span>
        </div>

        <h1 className="hero-title">{featuredVideo.title}</h1>
        <p className="hero-desc">{featuredVideo.description}</p>

        <div className="hero-actions">
          <button
            className="btn btn-primary"
            onClick={() => onWatch(featuredVideo.id)}
            style={{ padding: '12px 24px', fontSize: '14.5px' }}
          >
            <Play size={18} fill="#000000" />
            Watch Match Now
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
            <img
              src={featuredVideo.creator_avatar || '/uploads/avatars/avatar_admin.svg'}
              alt={featuredVideo.creator_username}
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #fff' }}
            />
            <div style={{ fontSize: '13px' }}>
              <div style={{ fontWeight: 800, color: '#fff' }}>{featuredVideo.creator_username}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Reikage Official Production</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

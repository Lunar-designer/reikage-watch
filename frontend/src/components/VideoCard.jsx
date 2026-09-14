import React from 'react';
import { formatTimeAgo } from '../utils/dateUtils';

export default function VideoCard({ video, onSelectVideo, onSelectCreator }) {
  if (!video) return null;

  const formatViews = (num) => {
    if (!num || num === 0) return '0 views';
    if (num === 1) return '1 view';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
    return `${num} views`;
  };

  return (
    <article className="video-card" onClick={() => onSelectVideo(video.id)}>
      <div className="video-thumbnail-wrapper">
        <img
          src={video.thumbnail_url || '/uploads/thumbnails/thumb_reikage_default.svg'}
          alt={video.title}
          className="video-thumbnail-img"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/uploads/thumbnails/thumb_reikage_default.svg';
          }}
        />
        {video.category && (
          <span className="video-category-tag">{video.category}</span>
        )}
        <span className="video-duration-pill">{video.duration || '00:00'}</span>
      </div>

      <div className="video-info">
        <img
          src={video.creator_avatar || '/uploads/avatars/avatar_admin.svg'}
          alt={video.creator_username}
          className="video-creator-avatar"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/uploads/avatars/avatar_admin.svg';
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectCreator) onSelectCreator(video.creator_username);
          }}
          title={video.creator_username}
        />

        <div className="video-details">
          <h3 className="video-title" title={video.title}>
            {video.title}
          </h3>

          <div
            className="video-meta-creator"
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectCreator) onSelectCreator(video.creator_username);
            }}
          >
            <span>{video.creator_username}</span>
            {video.creator_rank && (
              <span className="badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                {video.creator_rank.includes('Master') || video.creator_rank.includes('Leader') ? 'RK' : 'PRO'}
              </span>
            )}
          </div>

          <div className="video-meta-stats">
            <span>{formatViews(video.views_count)}</span>
            <span style={{ margin: '0 5px' }}>•</span>
            <span>{formatTimeAgo(video.created_at)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

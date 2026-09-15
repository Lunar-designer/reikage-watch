import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import ShareModal from '../components/ShareModal';
import ReportModal from '../components/ReportModal';
import { formatTimeAgo, parseUtcDate } from '../utils/dateUtils';
import { 
  ThumbsUp, Share2, Flag, Trash2, Check, UserPlus, 
  UserCheck, MessageSquare, Shield, Clock, Eye, AlertTriangle, RotateCw 
} from 'lucide-react';

export default function WatchPage({ videoId, onSelectVideo, onSelectCreator }) {
  const { user, openAuthModal } = useAuth();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  // Modals
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState({ type: 'video', id: videoId, title: '' });

  useEffect(() => {
    async function loadWatchData() {
      setLoading(true);
      try {
        const data = await api.getVideo(videoId);
        if (data && data.video) {
          setVideo(data.video);
          setReportTarget({ type: 'video', id: data.video.id, title: data.video.title });
        }

        const commentsData = await api.getComments(videoId);
        if (commentsData && commentsData.comments) {
          setComments(commentsData.comments);
        }

        const relData = await api.getVideos({ limit: 8 });
        if (relData && relData.videos) {
          setRelatedVideos(relData.videos.filter(v => v.id !== videoId));
        }
      } catch (err) {
        console.error('Failed to load video details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWatchData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [videoId]);

  const handleLikeToggle = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await api.toggleLike(video.id);
      setVideo(prev => ({
        ...prev,
        hasLiked: res.hasLiked,
        likes_count: res.likesCount
      }));
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleSubscribeToggle = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await api.toggleSubscribe(video.creator_username);
      setVideo(prev => ({
        ...prev,
        isSubscribed: res.isSubscribed,
        subscribers_count: res.subscribersCount
      }));
    } catch (err) {
      console.error('Subscribe error:', err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.postComment(video.id, newComment);
      if (res && res.comment) {
        setComments(prev => [res.comment, ...prev]);
        setNewComment('');
      }
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  const handleDeleteVideo = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this video broadcast?')) return;
    try {
      await api.deleteVideo(video.id);
      alert('Video removed.');
      window.location.hash = '#home';
    } catch (err) {
      alert(err.message || 'Failed to delete video');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="reikage-spinner-white" style={{ width: '48px', height: '48px', marginBottom: '18px' }} />
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', letterSpacing: '2px' }}>
          BUFFERING REIKAGE FEED...
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Broadcast not found</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>This match file may have been archived or removed.</p>
      </div>
    );
  }

  return (
    <div className="watch-page-container" style={{ display: 'flex', gap: '28px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Main Watch Column */}
      <div className="watch-main-column" style={{ flex: '1 1 70%', minWidth: 0 }}>
        {/* Custom Video Player Container */}
        <div
          className="video-player-container"
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            background: '#000000',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <video
            key={video.video_url}
            src={video.video_url}
            poster={video.thumbnail_url}
            controls
            autoPlay
            playsInline
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => { setIsBuffering(false); setVideoError(false); }}
            onCanPlay={() => { setIsBuffering(false); setVideoError(false); }}
            onLoadedData={() => { setIsBuffering(false); setVideoError(false); }}
            onSeeking={() => setIsBuffering(true)}
            onSeeked={() => setIsBuffering(false)}
            onError={(e) => {
              console.warn('Video failed to load or stream:', e);
              setIsBuffering(false);
              setVideoError(true);
            }}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          >
            Your browser does not support the HTML5 video player.
          </video>

          {isBuffering && !videoError && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(3px)',
                pointerEvents: 'none',
                zIndex: 10
              }}
            >
              <div className="reikage-spinner-white" style={{ width: '52px', height: '52px', borderWidth: '4px' }} />
              <div style={{ marginTop: '14px', fontSize: '12px', fontWeight: 800, color: '#ffffff', letterSpacing: '2px' }}>
                BUFFERING VIDEO...
              </div>
            </div>
          )}

          {videoError && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(8, 8, 8, 0.92)',
                backdropFilter: 'blur(6px)',
                zIndex: 15,
                padding: '28px',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(255, 68, 68, 0.12)',
                  border: '1px solid rgba(255, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}
              >
                <AlertTriangle size={28} color="#ff5555" />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff', letterSpacing: '1px', marginBottom: '8px' }}>
                BROADCAST FEED UNAVAILABLE
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', lineHeight: 1.5, marginBottom: '20px' }}>
                This match recording is currently unavailable or corrupted. You can retry loading or select another broadcast.
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setVideoError(false);
                    setIsBuffering(true);
                    const v = document.querySelector('.video-player-container video');
                    if (v) { v.load(); v.play().catch(() => {}); }
                  }}
                  style={{ borderRadius: 'var(--radius-full)', padding: '9px 18px' }}
                >
                  <RotateCw size={15} /> Retry Playback
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => { window.location.hash = '#home'; }}
                  style={{ borderRadius: 'var(--radius-full)', padding: '9px 18px' }}
                >
                  Back to Arena Feed
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Video Title */}
        <h1 style={{ fontSize: '22px', fontWeight: 900, marginTop: '16px', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
          {video.title}
        </h1>

        {/* Action & Creator Bar */}
        <div
          className="watch-action-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '16px 0',
            borderBottom: '1px solid var(--border-dim)'
          }}
        >
          {/* Creator Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={video.creator_avatar || '/uploads/avatars/avatar_admin.svg'}
              alt={video.creator_username}
              style={{ width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', border: '1.5px solid #ffffff', objectFit: 'cover', aspectRatio: '1 / 1', flexShrink: 0 }}
              onClick={() => onSelectCreator(video.creator_username)}
            />
            <div>
              <div
                style={{ fontWeight: 800, fontSize: '15px', color: '#fff', cursor: 'pointer' }}
                onClick={() => onSelectCreator(video.creator_username)}
              >
                {video.creator_username}
                <span className="badge badge-reikage" style={{ marginLeft: '6px' }}>
                  {video.creator_username?.toLowerCase() === 'lunar' ? 'Reikage Watch Owner' : (video.creator_rank || 'Pro Member')}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {(video.subscribers_count >= 1000 ? `${(video.subscribers_count / 1000).toFixed(1)}K` : (video.subscribers_count || 0))} followers
              </div>
            </div>

            {/* Subscribe / Follow Button */}
            {user?.id !== video.user_id && (
              <button
                className={`btn ${video.isSubscribed ? 'btn-secondary' : 'btn-primary'}`}
                style={{ marginLeft: '8px', padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
                onClick={handleSubscribeToggle}
              >
                {video.isSubscribed ? (
                  <>
                    <UserCheck size={16} /> Following
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Follow Creator
                  </>
                )}
              </button>
            )}
          </div>

          {/* Action Buttons: Like, Share, Report, Delete */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className={`btn ${video.hasLiked ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleLikeToggle}
              style={{ borderRadius: 'var(--radius-full)', padding: '8px 16px' }}
              title="Like this match"
            >
              <ThumbsUp size={16} fill={video.hasLiked ? '#000000' : 'none'} />
              <span>{video.likes_count || 0}</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => setShareOpen(true)}
              style={{ borderRadius: 'var(--radius-full)', padding: '8px 16px' }}
              title="Share video"
            >
              <Share2 size={16} />
              <span>Share</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setReportTarget({ type: 'video', id: video.id, title: video.title });
                setReportOpen(true);
              }}
              style={{ borderRadius: 'var(--radius-full)', padding: '8px 12px' }}
              title="Report broadcast"
            >
              <Flag size={16} />
            </button>

            {/* Delete button (Owner or Admin) */}
            {(user?.id === video.user_id || user?.role === 'admin') && (
              <button
                className="btn btn-danger"
                onClick={handleDeleteVideo}
                style={{ borderRadius: 'var(--radius-full)', padding: '8px 12px' }}
                title="Remove video"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Video Description Box */}
        <div
          className="watch-desc-box"
          style={{
            marginTop: '16px',
            padding: '16px 20px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
          onClick={() => setDescExpanded(!descExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', fontSize: '13px', fontWeight: 800 }}>
            <span>{video.views_count?.toLocaleString()} views</span>
            <span>Uploaded {formatTimeAgo(video.created_at)}</span>
            <span className="badge">{video.category}</span>
          </div>

          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              whiteSpace: 'pre-line',
              display: descExpanded ? 'block' : '-webkit-box',
              WebkitLineClamp: descExpanded ? 'unset' : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {video.description || 'No description provided.'}
          </p>

          {video.tags && (
            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {video.tags.split(',').map((t, idx) => (
                <span key={idx} style={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}>
                  #{t.trim()}
                </span>
              ))}
            </div>
          )}

          <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>
            {descExpanded ? 'Show less' : '...more'}
          </div>
        </div>

        {/* Comments Section */}
        <section className="watch-comments-section" style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <MessageSquare size={20} color="#ffffff" />
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
              {comments.length} Comments
            </h2>
          </div>

          {/* Post Comment Input */}
          {user ? (
            <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '14px', marginBottom: '28px' }}>
              <img
                src={user.avatar_url || '/uploads/avatars/avatar_admin.svg'}
                alt={user.username}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', aspectRatio: '1 / 1', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Add a comment to the match reel..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{ width: '100%', marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setNewComment('')}
                    style={{ fontSize: '12px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingComment || !newComment.trim()}
                    style={{ fontSize: '12px' }}
                  >
                    {submittingComment ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div
              style={{
                padding: '16px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid var(--border-dim)'
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Sign in to join the Reikage match discussion and leave a comment.
              </span>
              <button className="btn btn-primary" onClick={() => openAuthModal('login')} style={{ fontSize: '12px' }}>
                Sign In
              </button>
            </div>
          )}

          {/* Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-dim)'
                }}
              >
                <img
                  src={comment.avatar_url || '/uploads/avatars/avatar_admin.svg'}
                  alt={comment.username}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', aspectRatio: '1 / 1', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>
                      {comment.username}
                    </span>
                    {comment.clan_rank && (
                      <span className="badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                        {comment.clan_rank}
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>

                  <p style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    {comment.content}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => {
                        setReportTarget({ type: 'comment', id: comment.id, title: `Comment by ${comment.username}` });
                        setReportOpen(true);
                      }}
                    >
                      <Flag size={12} /> Report
                    </button>

                    {(user?.id === comment.user_id || user?.role === 'admin') && (
                      <button
                        className="btn-ghost"
                        style={{ fontSize: '11px', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Up Next / Related Videos Column */}
      <aside className="watch-sidebar-column" style={{ flex: '1 1 30%', maxWidth: '420px', minWidth: '280px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '14px' }}>UP NEXT IN REIKAGE</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {relatedVideos.map((rel) => (
            <div
              key={rel.id}
              style={{ display: 'flex', gap: '10px', cursor: 'pointer' }}
              onClick={() => onSelectVideo(rel.id)}
            >
              <div
                style={{
                  position: 'relative',
                  width: '130px',
                  aspectRatio: '16 / 9',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '1px solid var(--border-dim)'
                }}
              >
                <img
                  src={rel.thumbnail_url}
                  alt={rel.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span className="video-duration-pill" style={{ bottom: '4px', right: '4px', fontSize: '9px', padding: '1px 4px' }}>
                  {rel.duration}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    lineHeight: 1.25,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: '3px'
                  }}
                >
                  {rel.title}
                </h4>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  {rel.creator_username}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {rel.views_count?.toLocaleString()} views
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Modals */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        videoId={video.id}
        videoTitle={video.title}
      />

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType={reportTarget.type}
        targetId={reportTarget.id}
        targetTitle={reportTarget.title}
      />
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Upload, Video, Image, CheckCircle, AlertTriangle, FileText, Tag, Folder } from 'lucide-react';
import { formatVideoDuration } from '../utils/dateUtils';

const CATEGORIES = [
  'Highlights',
  'Clan Wars',
  'Montages',
  'Scrims',
  'Tactics & Guides',
  'Tournaments'
];

export default function UploadPage({ onSelectVideo, onNavigate }) {
  const { user, openAuthModal } = useAuth();
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Highlights');
  const [tags, setTags] = useState('');
  const [duration, setDuration] = useState('');
  const [detectingDuration, setDetectingDuration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '500px', margin: '0 auto' }}>
        <Video size={48} color="#ffffff" style={{ margin: '0 auto 16px auto', opacity: 0.7 }} />
        <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>REIKAGE CLAN CREATOR STUDIO</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          Please sign in with your Reikage account to upload match recordings and scrim videos.
        </p>
        <button className="btn btn-primary" onClick={() => openAuthModal('login')} style={{ padding: '12px 28px' }}>
          Sign In to Upload
        </button>
      </div>
    );
  }

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 300 * 1024 * 1024) {
        setError('Video file exceeds 300MB clan quota limit.');
        return;
      }
      setVideoFile(file);
      setError('');
      if (!title) {
        // Auto-generate title from filename
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(baseName.toUpperCase());
      }

      // Automatically detect real-time video duration from file metadata
      setDetectingDuration(true);
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      const fileUrl = URL.createObjectURL(file);
      tempVideo.src = fileUrl;

      tempVideo.onloadedmetadata = () => {
        URL.revokeObjectURL(fileUrl);
        setDetectingDuration(false);
        const sec = tempVideo.duration;
        if (sec && !isNaN(sec) && isFinite(sec)) {
          setDuration(formatVideoDuration(sec));
        } else {
          setDuration('00:00');
        }
      };

      tempVideo.onerror = () => {
        URL.revokeObjectURL(fileUrl);
        setDetectingDuration(false);
        setDuration('00:00');
      };
    }
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setError('Please select a video file.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a video title.');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(25);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('tags', tags.trim());
      formData.append('duration', duration.trim() || '00:00');

      setUploadProgress(60);
      const res = await api.uploadVideo(formData);
      setUploadProgress(100);

      setTimeout(() => {
        if (res && res.video) {
          onSelectVideo(res.video.id);
        } else {
          onNavigate('channel', { username: user.username });
        }
      }, 600);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900 }}>REIKAGE CREATOR STUDIO // UPLOAD</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
          Publish match footage, tournament clips, and tactical breakdowns to Reikage Watch.
        </p>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger-text)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            fontSize: '13.5px'
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Step 1: Video File Selection */}
        <div
          style={{
            border: '2px dashed var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px 20px',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            cursor: 'pointer',
            transition: 'border-color 0.2s'
          }}
          onClick={() => videoInputRef.current?.click()}
        >
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/mkv,video/quicktime"
            style={{ display: 'none' }}
            onChange={handleVideoSelect}
          />

          {videoFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={36} color="#ffffff" />
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                {videoFile.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {(videoFile.size / (1024 * 1024)).toFixed(2)} MB {duration ? `• Length: ${duration}` : detectingDuration ? '• Detecting length...' : ''} • Ready for ingestion
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: '8px', fontSize: '12px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  videoInputRef.current?.click();
                }}
              >
                Change File
              </button>
            </div>
          ) : (
            <div>
              <Upload size={40} color="#ffffff" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '16px', fontWeight: 800 }}>Select Match Video to Upload</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Supports MP4, WebM, MOV. Up to 300MB.
              </div>
              <button type="button" className="btn btn-primary" style={{ marginTop: '14px' }}>
                Browse Files
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Metadata Details */}
        <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              VIDEO TITLE (REQUIRED)
            </label>
            <input
              type="text"
              placeholder="e.g. REIKAGE vs FNATIC // MASTERS SCRIM HIGHLIGHTS"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              DESCRIPTION
            </label>
            <textarea
              rows={4}
              placeholder="Provide tactical context, round breakdowns, timestamps, and shoutouts..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%' }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  DURATION {detectingDuration ? '(DETECTING...)' : '(AUTO-DETECTED)'}
                </label>
                {duration && !detectingDuration && (
                  <span style={{ fontSize: '10px', color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                    Auto-detected
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder={detectingDuration ? 'Detecting length...' : '00:00'}
                value={detectingDuration ? 'Detecting video length...' : duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              TAGS (COMMA SEPARATED)
            </label>
            <input
              type="text"
              placeholder="reikage, valorant, clutch, ace, tournament"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Thumbnail Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              CUSTOM THUMBNAIL (OPTIONAL)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => thumbInputRef.current?.click()}
              >
                <Image size={16} /> Choose Image
              </button>
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleThumbnailSelect}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {thumbnailFile ? thumbnailFile.name : 'Defaults to Reikage tournament emblem thumbnail if empty.'}
              </span>
            </div>

            {thumbnailPreview && (
              <div style={{ marginTop: '12px', width: '200px', aspectRatio: '16/9', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-medium)' }}>
                <img src={thumbnailPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: 700 }}>
              <span>Uploading to Reikage storage node...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#222', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#fff', transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !videoFile}
          style={{ padding: '14px', fontSize: '15px' }}
        >
          {loading ? 'Ingesting Match Video...' : 'Publish Broadcast to Reikage Watch'}
        </button>
      </form>
    </div>
  );
}

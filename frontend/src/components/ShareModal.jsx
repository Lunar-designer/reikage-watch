import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, videoTitle, videoId }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/#watch/${videoId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback
      setCopied(true);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="btn-icon btn-ghost"
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px' }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Share2 size={22} color="#ffffff" />
          <h2 style={{ fontSize: '19px', fontWeight: 800 }}>SHARE REIKAGE VIDEO</h2>
        </div>

        {videoTitle && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
            {videoTitle}
          </p>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px' }}>
            DIRECT MATCH LINK
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              readOnly
              value={shareUrl}
              style={{ flex: 1, background: '#0a0a0a', color: '#fff', fontSize: '13px' }}
            />
            <button
              className="btn btn-primary"
              onClick={handleCopy}
              style={{ minWidth: '100px' }}
            >
              {copied ? (
                <>
                  <Check size={16} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>
            QUICK SOCIAL DISPATCH
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <a
              href={`https://twitter.com/intent/tweet?text=Watching%20${encodeURIComponent(videoTitle)}%20on%20REIKAGE%20WATCH%20&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '12px', justifyContent: 'center' }}
            >
              Share on X
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '12px', justifyContent: 'center' }}
            >
              <MessageSquare size={14} /> Discord Comms
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

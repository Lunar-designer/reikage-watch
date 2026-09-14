import React, { useState } from 'react';
import { api } from '../services/api';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, targetType, targetId, targetTitle }) {
  const [reason, setReason] = useState('Inappropriate Content');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.submitReport(targetType, targetId, reason, details);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1600);
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
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
          <AlertTriangle size={22} color="#ffffff" />
          <h2 style={{ fontSize: '19px', fontWeight: 800 }}>REPORT {targetType.toUpperCase()}</h2>
        </div>

        {targetTitle && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Target: <strong style={{ color: '#fff' }}>{targetTitle}</strong>
          </p>
        )}

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle size={44} color="#ffffff" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Report Submitted</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Reikage Clan moderators have received your report and will review it immediately.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{ padding: '8px 12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)', borderRadius: '6px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                REASON FOR REPORT
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="Inappropriate Content">Inappropriate Content / NSFW</option>
                <option value="Spam or Advertising">Spam or Unwanted Self-Promotion</option>
                <option value="Harassment or Toxicity">Harassment, Toxicity, or Hate Speech</option>
                <option value="Clan Rule Violation">Reikage Clan Rule Violation / Unsportsmanlike</option>
                <option value="Cheating or Exploits">Suspected Cheating, Hacking, or Exploits</option>
                <option value="Copyright or Stolen Gameplay">Stolen Gameplay / Impersonation</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                ADDITIONAL CONTEXT (OPTIONAL)
              </label>
              <textarea
                rows={3}
                placeholder="Provide timestamps or specific details for clan moderators..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

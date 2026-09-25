import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Settings, Shield, User, Lock, Upload, CheckCircle, AlertTriangle, Crop } from 'lucide-react';
import AvatarCropModal from '../components/AvatarCropModal';

export default function SettingsPage({ onNavigate }) {
  const { user, refreshUser, openAuthModal } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');
  const [rawImageForCrop, setRawImageForCrop] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const avatarInputRef = useRef(null);

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '480px', margin: '0 auto' }}>
        <Lock size={44} color="#ffffff" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
        <h2 style={{ fontSize: '20px', fontWeight: 900 }}>AUTHENTICATION REQUIRED</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '6px', marginBottom: '20px' }}>
          Please sign in to view and customize your Reikage Clan account settings.
        </p>
        <button className="btn btn-primary" onClick={() => openAuthModal('login')}>
          Sign In
        </button>
      </div>
    );
  }

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|bmp|jfif|avif)$/i.test(file.name)) {
        setErrorMsg('Please select a valid image file (JPG, PNG, WEBP, GIF, BMP, JFIF).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setRawImageForCrop(reader.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropConfirm = (croppedFile, croppedPreviewUrl) => {
    setAvatarFile(croppedFile);
    setAvatarPreview(croppedPreviewUrl);
    setShowCropModal(false);
    setSuccessMsg('Profile photo scaled & centered! Click "Save Settings" below to publish.');
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setErrorMsg('New passwords do not match.');
        setLoading(false);
        return;
      }
      if (!currentPassword) {
        setErrorMsg('Current password is required to change your password.');
        setLoading(false);
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append('bio', bio);
      if (avatarFile) {
        formData.append('avatar', avatarFile, 'avatar.jpg');
      }
      if (newPassword) {
        formData.append('newPassword', newPassword);
        formData.append('currentPassword', currentPassword);
      }

      await api.updateSettings(formData);
      await refreshUser();
      setSuccessMsg('Account settings and avatar updated successfully!');
      setAvatarFile(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update settings. Please verify your photo size and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Crop and Scale Modal */}
      {showCropModal && rawImageForCrop && (
        <AvatarCropModal
          imageSrc={rawImageForCrop}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <Settings size={24} color="#ffffff" />
        <h1 style={{ fontSize: '24px', fontWeight: 900 }}>ACCOUNT SETTINGS // {user.username}</h1>
      </div>

      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#0e1f12', border: '1px solid #1a4022', color: '#69db7c', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontWeight: 700 }}>
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontWeight: 700 }}>
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Avatar section */}
        <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>CLAN AVATAR</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img
              src={avatarPreview || '/uploads/avatars/avatar_admin.svg'}
              alt={user.username}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/uploads/avatars/avatar_admin.svg'; }}
              style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', aspectRatio: '1 / 1', border: '2px solid #fff', flexShrink: 0 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => avatarInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Upload size={16} /> Choose & Scale Photo
                </button>
                {rawImageForCrop && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCropModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Crop size={16} /> Re-adjust Scaling
                  </button>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarSelect}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Select any photo from PC. Interactive scaling ensures your profile photo is never squished or crushed.
              </div>
            </div>
          </div>
        </div>

        {/* Bio section */}
        <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px' }}>CREATOR BIO</h2>
          <textarea
            rows={3}
            placeholder="Tell the clan about your competitive history, agents, weapons, and achievements..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            style={{ width: '100%', resize: 'vertical' }}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
            {bio.length}/300
          </div>
        </div>

        {/* Password Security section */}
        <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800 }}>UPDATE PASSWORD</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '-8px' }}>
            Leave blank if you do not wish to change your password.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>CURRENT PASSWORD</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>NEW PASSWORD</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>CONFIRM NEW PASSWORD</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ padding: '14px', fontSize: '15px' }}
        >
          {loading ? 'Saving Profile...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

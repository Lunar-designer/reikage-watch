import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Home, Flame, Trophy, Upload, Shield, 
  Settings, User, ExternalLink
} from 'lucide-react';

export default function Sidebar({ collapsed, activePage, onNavigate }) {
  const { user, openAuthModal } = useAuth();
  const [clanMembers, setClanMembers] = useState([]);

  useEffect(() => {
    async function loadMembers() {
      try {
        const data = await api.getRoster();
        if (data && data.members) {
          setClanMembers(data.members);
        }
      } catch (err) {
        // silent fallback
      }
    }
    loadMembers();
  }, []);

  const navItems = [
    { id: 'home', label: 'Home Feed', icon: Home },
    { id: 'explore', label: 'Explore & Trending', icon: Flame },
    { id: 'clan', label: 'Reikage Clan Hub', icon: Trophy },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Primary Navigation */}
      <div className="sidebar-section">
        <div className="sidebar-heading">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={item.label}
            >
              <Icon size={19} />
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Creator & Studio Section */}
      <div className="sidebar-section">
        <div className="sidebar-heading">Studio & Creator</div>
        {user ? (
          <>
            <button
              className={`sidebar-item ${activePage === 'channel' ? 'active' : ''}`}
              onClick={() => onNavigate('channel', { username: user.username })}
              title="My Channel"
            >
              <User size={19} />
              {!collapsed && <span className="sidebar-label">My Channel</span>}
            </button>

            <button
              className={`sidebar-item ${activePage === 'upload' ? 'active' : ''}`}
              onClick={() => onNavigate('upload')}
              title="Upload Video"
            >
              <Upload size={19} />
              {!collapsed && <span className="sidebar-label">Upload Video</span>}
            </button>

            <button
              className={`sidebar-item ${activePage === 'settings' ? 'active' : ''}`}
              onClick={() => onNavigate('settings')}
              title="Settings"
            >
              <Settings size={19} />
              {!collapsed && <span className="sidebar-label">Settings</span>}
            </button>
          </>
        ) : (
          <button
            className="sidebar-item"
            onClick={() => openAuthModal('login')}
            title="Sign In to Upload"
          >
            <Upload size={19} />
            {!collapsed && <span className="sidebar-label">Sign in to Upload</span>}
          </button>
        )}
      </div>

      {/* Staff & Admin Section */}
      {user && (user.role === 'admin' || user.role === 'staff') && (
        <div className="sidebar-section">
          <div className="sidebar-heading">Clan Moderation</div>
          <button
            className={`sidebar-item ${activePage === 'admin' ? 'active' : ''}`}
            onClick={() => onNavigate('admin')}
            title="Admin Dashboard"
            style={{ color: '#ffffff' }}
          >
            <Shield size={19} />
            {!collapsed && <span className="sidebar-label" style={{ fontWeight: 800 }}>Admin Panel</span>}
          </button>
        </div>
      )}

      {/* Real Clan Members Section (Only shown when verified members exist) */}
      {!collapsed && clanMembers.length > 0 && (
        <div className="sidebar-section" style={{ marginTop: 'auto' }}>
          <div className="sidebar-heading">Clan Members</div>
          {clanMembers.map((member) => (
            <button
              key={member.id}
              className="sidebar-item"
              style={{ padding: '6px 12px' }}
              onClick={() => onNavigate('channel', { username: member.username })}
            >
              <img
                src={member.avatar_url || '/uploads/avatars/avatar_admin.svg'}
                alt={member.username}
                style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {member.username}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{member.role_title}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Discord CTA */}
      {!collapsed && (
        <div
          style={{
            marginTop: clanMembers.length > 0 ? '12px' : 'auto',
            padding: '12px',
            background: '#0d0d0d',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>
            REIKAGE DISCORD
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Competitive Esports Community
          </div>
          <a
            href="https://discord.gg/XPzSv9eWvg"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '11px', padding: '6px 10px' }}
          >
            Join Server <ExternalLink size={12} />
          </a>
        </div>
      )}
    </aside>
  );
}

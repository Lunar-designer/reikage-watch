import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, Upload, Shield, User, Settings, LogOut, 
  Menu, X, Swords, Video, Compass, Bell
} from 'lucide-react';

export default function Navbar({ onToggleSidebar, onNavigate, activePage, searchQuery, setSearchQuery }) {
  const { user, logout, openAuthModal } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('search', { query: searchQuery.trim() });
    }
  };

  return (
    <header className="navbar">
      <div className="nav-left">
        <button 
          className="btn-icon btn-ghost" 
          onClick={onToggleSidebar}
          aria-label="Toggle navigation drawer"
          title="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <a 
          href="#home" 
          className="brand-link" 
          onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
        >
          <img src="/logo.svg" alt="Reikage Watch" width="34" height="34" />
          <div>
            <span className="brand-title">REIKAGE WATCH</span>
            <span className="brand-tag">WATCH. CREATE. REIKAGE.</span>
          </div>
        </a>
      </div>

      {/* Center Search Bar */}
      <div className="nav-search-container">
        <form className="nav-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="nav-search-input"
            placeholder="Search Reikage matches, scrims, creators, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="nav-search-btn" title="Search">
            <Search size={17} />
          </button>
        </form>
      </div>

      {/* Nav Right Actions */}
      <div className="nav-right">
        {/* Mobile search toggle */}
        <button 
          className="btn-icon btn-ghost"
          style={{ display: window.innerWidth < 768 ? 'flex' : 'none' }}
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
        >
          <Search size={19} />
        </button>

        {user ? (
          <>
            <button 
              className="btn btn-secondary"
              onClick={() => onNavigate('upload')}
              title="Upload new video"
            >
              <Upload size={16} />
              <span style={{ display: window.innerWidth < 640 ? 'none' : 'inline' }}>Upload</span>
            </button>

            {/* User Profile Dropdown */}
            <div className="user-menu-wrapper" style={{ position: 'relative' }} ref={dropdownRef}>
              <button 
                className="user-profile-trigger" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-surface)',
                  padding: '4px 10px 4px 5px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <img 
                  src={user.avatar_url || '/uploads/avatars/avatar_admin.svg'} 
                  alt={user.username}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/uploads/avatars/avatar_admin.svg'; }}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', aspectRatio: '1 / 1', flexShrink: 0 }}
                />
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>
                  {user.username}
                </span>
              </button>

              {dropdownOpen && (
                <div 
                  className="user-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '240px',
                    background: '#121212',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 200,
                    animation: 'modalScaleUp 0.15s ease-out'
                  }}
                >
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-dim)' }}>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '14px' }}>{user.username}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Rank: <span style={{ color: '#fff' }}>{user.clan_rank || 'Member'}</span>
                    </div>
                  </div>

                  <div style={{ padding: '6px 0' }}>
                    <button 
                      className="sidebar-item" 
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                      onClick={() => { setDropdownOpen(false); onNavigate('channel', { username: user.username }); }}
                    >
                      <Video size={16} />
                      <span>My Channel</span>
                    </button>

                    <button 
                      className="sidebar-item" 
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                      onClick={() => { setDropdownOpen(false); onNavigate('upload'); }}
                    >
                      <Upload size={16} />
                      <span>Studio Upload</span>
                    </button>

                    <button 
                      className="sidebar-item" 
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                      onClick={() => { setDropdownOpen(false); onNavigate('settings'); }}
                    >
                      <Settings size={16} />
                      <span>Account Settings</span>
                    </button>

                    {(user.role === 'admin' || user.role === 'staff') && (
                      <button 
                        className="sidebar-item" 
                        style={{ width: '100%', justifyContent: 'flex-start', color: '#ffffff' }}
                        onClick={() => { setDropdownOpen(false); onNavigate('admin'); }}
                      >
                        <Shield size={16} color="#ffffff" />
                        <span style={{ fontWeight: 700 }}>Admin Dashboard</span>
                      </button>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '6px' }}>
                    <button 
                      className="sidebar-item" 
                      style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger-text)' }}
                      onClick={() => { setDropdownOpen(false); logout(); }}
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="btn btn-ghost" 
              onClick={() => openAuthModal('login')}
            >
              Sign In
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => openAuthModal('signup')}
            >
              Join Reikage
            </button>
          </div>
        )}
      </div>

      {/* Mobile search bar dropdown */}
      {mobileSearchOpen && (
        <div style={{
          position: 'absolute',
          top: 'var(--header-height)',
          left: 0,
          right: 0,
          background: '#0a0a0a',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          zIndex: 99
        }}>
          <form onSubmit={(e) => { handleSearchSubmit(e); setMobileSearchOpen(false); }}>
            <input
              type="text"
              className="nav-search-input"
              placeholder="Search Reikage Watch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </form>
        </div>
      )}
    </header>
  );
}

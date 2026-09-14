import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';

import HomePage from './pages/HomePage';
import WatchPage from './pages/WatchPage';
import ChannelPage from './pages/ChannelPage';
import UploadPage from './pages/UploadPage';
import SearchPage from './pages/SearchPage';
import ClanHubPage from './pages/ClanHubPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [pageParams, setPageParams] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Hash routing for clean linkability & browser back/forward buttons
  useEffect(() => {
    function parseHash() {
      const hash = window.location.hash.replace('#', '') || '/';
      const parts = hash.split('/').filter(Boolean);

      if (parts.length === 0 || parts[0] === 'home') {
        setActivePage('home');
        setPageParams({});
      } else if (parts[0] === 'explore') {
        setActivePage('explore');
        setPageParams({});
      } else if (parts[0] === 'watch' && parts[1]) {
        setActivePage('watch');
        setPageParams({ videoId: parts[1] });
      } else if (parts[0] === 'channel' && parts[1]) {
        setActivePage('channel');
        setPageParams({ username: parts[1] });
      } else if (parts[0] === 'upload') {
        setActivePage('upload');
        setPageParams({});
      } else if (parts[0] === 'search') {
        const query = decodeURIComponent(parts[1] || '');
        setActivePage('search');
        setPageParams({ query });
        setSearchQuery(query);
      } else if (parts[0] === 'clan') {
        setActivePage('clan');
        setPageParams({});
      } else if (parts[0] === 'admin') {
        setActivePage('admin');
        setPageParams({});
      } else if (parts[0] === 'settings') {
        setActivePage('settings');
        setPageParams({});
      }
    }

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const navigate = (page, params = {}) => {
    setActivePage(page);
    setPageParams(params);

    if (page === 'home') window.location.hash = '#/';
    else if (page === 'explore') window.location.hash = '#/explore';
    else if (page === 'watch') window.location.hash = `#/watch/${params.videoId}`;
    else if (page === 'channel') window.location.hash = `#/channel/${params.username}`;
    else if (page === 'upload') window.location.hash = '#/upload';
    else if (page === 'search') window.location.hash = `#/search/${encodeURIComponent(params.query || '')}`;
    else if (page === 'clan') window.location.hash = '#/clan';
    else if (page === 'admin') window.location.hash = '#/admin';
    else if (page === 'settings') window.location.hash = '#/settings';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectVideo = (videoId) => {
    navigate('watch', { videoId });
  };

  const handleSelectCreator = (username) => {
    navigate('channel', { username });
  };

  return (
    <div className="app-container">
      <Navbar
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={navigate}
        activePage={activePage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="app-main-layout">
        <Sidebar
          collapsed={sidebarCollapsed}
          activePage={activePage}
          onNavigate={navigate}
        />

        <main className="main-content">
          {activePage === 'home' && (
            <HomePage
              onSelectVideo={handleSelectVideo}
              onSelectCreator={handleSelectCreator}
            />
          )}

          {activePage === 'explore' && (
            <HomePage
              onSelectVideo={handleSelectVideo}
              onSelectCreator={handleSelectCreator}
            />
          )}

          {activePage === 'watch' && (
            <WatchPage
              videoId={pageParams.videoId}
              onSelectVideo={handleSelectVideo}
              onSelectCreator={handleSelectCreator}
            />
          )}

          {activePage === 'channel' && (
            <ChannelPage
              username={pageParams.username}
              onSelectVideo={handleSelectVideo}
              onNavigate={navigate}
            />
          )}

          {activePage === 'upload' && (
            <UploadPage
              onSelectVideo={handleSelectVideo}
              onNavigate={navigate}
            />
          )}

          {activePage === 'search' && (
            <SearchPage
              query={pageParams.query}
              onSelectVideo={handleSelectVideo}
              onSelectCreator={handleSelectCreator}
            />
          )}

          {activePage === 'clan' && (
            <ClanHubPage
              onSelectCreator={handleSelectCreator}
            />
          )}

          {activePage === 'admin' && (
            <AdminPage
              onSelectVideo={handleSelectVideo}
              onSelectCreator={handleSelectCreator}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              onNavigate={navigate}
            />
          )}
        </main>
      </div>

      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

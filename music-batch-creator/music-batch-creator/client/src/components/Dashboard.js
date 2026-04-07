import React, { useState } from 'react';
import SongsTab from './SongsTab';
import PlaylistsTab from './PlaylistsTab';

function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState('songs');

  return (
    <div className="app-container page-bottom-padding">
      <div className="tabs">
        <button
          className={activeTab === 'songs' ? 'active' : ''}
          onClick={() => setActiveTab('songs')}
        >
          🎵 My Songs
        </button>
        <button
          className={activeTab === 'playlists' ? 'active' : ''}
          onClick={() => setActiveTab('playlists')}
        >
          📋 Playlists
        </button>
      </div>

      {activeTab === 'songs' && <SongsTab />}
      {activeTab === 'playlists' && <PlaylistsTab />}
    </div>
  );
}

export default Dashboard;

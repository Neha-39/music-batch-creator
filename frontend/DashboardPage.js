import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdPlayArrow, MdFileUpload, MdQueueMusic, MdTrendingUp, MdAudiotrack } from 'react-icons/md';
import { songsAPI, playlistsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import SongRow from '../components/songs/SongRow';
import PlaylistCard from '../components/playlists/PlaylistCard';
import toast from 'react-hot-toast';
import './Dashboard.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const { playQueue } = usePlayer();
  const navigate = useNavigate();

  const [recentSongs, setRecentSongs]         = useState([]);
  const [recentPlaylists, setRecentPlaylists] = useState([]);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [songsRes, playlistsRes] = await Promise.all([
          songsAPI.getMy({ limit: 6, sort: '-createdAt' }),
          playlistsAPI.getMy({ limit: 4, sort: '-createdAt' }),
        ]);
        setRecentSongs(songsRes.data.data);
        setRecentPlaylists(playlistsRes.data.data);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = [
    { label: 'Songs Uploaded', value: user?.totalUploads || 0, icon: MdAudiotrack, color: 'var(--gold)' },
    { label: 'Playlists',      value: user?.totalPlaylists || 0, icon: MdQueueMusic, color: '#52c97a' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page dashboard-page">
      {/* Hero */}
      <div className="dashboard-hero">
        <div className="dashboard-hero__text">
          <div className="dashboard-greeting">{greeting}</div>
          <h1 className="dashboard-hero__name">{user?.username} 👋</h1>
          <p className="dashboard-hero__sub">
            {user?.bio || 'Manage your music, create playlists, and share with the world.'}
          </p>
          <div className="dashboard-hero__actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/upload')}
            >
              <MdFileUpload /> Upload Music
            </button>
            <button
              className="btn btn-ghost btn-lg"
              onClick={() => navigate('/playlists')}
            >
              <MdQueueMusic /> My Playlists
            </button>
          </div>
        </div>
        <div className="dashboard-hero__visual">
          <div className="dashboard-vinyl">
            <div className="dashboard-vinyl__inner">♪</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div className="dashboard-stat card" key={label}>
            <div className="dashboard-stat__icon" style={{ color, background: `${color}18` }}>
              <Icon />
            </div>
            <div className="dashboard-stat__info">
              <div className="dashboard-stat__value">{value}</div>
              <div className="dashboard-stat__label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Songs */}
      <section className="dashboard-section">
        <div className="dashboard-section__header">
          <h2 className="dashboard-section__title">Recently Uploaded</h2>
          <Link to="/songs" className="dashboard-section__link">View all →</Link>
        </div>

        {loading ? (
          <div className="dashboard-skeleton-list">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />
            ))}
          </div>
        ) : recentSongs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎵</div>
            <div className="empty-state-title">No songs yet</div>
            <div className="empty-state-text">Upload your first track to get started</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/upload')}>
              Upload Now
            </button>
          </div>
        ) : (
          <div className="songs-grid">
            <div className="song-row-header">
              <div /><div />
              <div>Title</div>
              <div className="hide-mobile">Album</div>
              <div className="hide-tablet">Genre</div>
              <div style={{ textAlign: 'right' }}>Time</div>
              <div />
            </div>
            {recentSongs.map((song, i) => (
              <SongRow
                key={song._id}
                song={song}
                index={i}
                queue={recentSongs}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent Playlists */}
      <section className="dashboard-section">
        <div className="dashboard-section__header">
          <h2 className="dashboard-section__title">Your Playlists</h2>
          <Link to="/playlists" className="dashboard-section__link">View all →</Link>
        </div>

        {loading ? (
          <div className="cards-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '1', borderRadius: 12 }} />
            ))}
          </div>
        ) : recentPlaylists.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No playlists yet</div>
            <div className="empty-state-text">Create a playlist to organize your music</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/playlists')}>
              Create Playlist
            </button>
          </div>
        ) : (
          <div className="cards-grid">
            {recentPlaylists.map(pl => (
              <PlaylistCard key={pl._id} playlist={pl} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

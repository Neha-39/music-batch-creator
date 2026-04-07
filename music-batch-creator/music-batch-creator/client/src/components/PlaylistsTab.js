import React, { useState, useEffect } from 'react';
import {
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from '../api';
import { getSongs } from '../api';

function PlaylistsTab() {
  const [playlists, setPlaylists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedSongs, setSelectedSongs] = useState({}); // { playlistId: songId }
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlaylists();
    fetchSongs();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await getPlaylists();
      setPlaylists(res.data);
    } catch (err) {
      setError('Failed to load playlists.');
    }
  };

  const fetchSongs = async () => {
    try {
      const res = await getSongs();
      setSongs(res.data);
    } catch (err) {
      console.error('Failed to load songs for playlist selector.');
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return setError('Playlist name cannot be empty.');
    setError('');
    try {
      await createPlaylist({ name: newPlaylistName.trim() });
      setMessage(`Playlist "${newPlaylistName}" created!`);
      setNewPlaylistName('');
      fetchPlaylists();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create playlist.');
    }
  };

  const handleDeletePlaylist = async (id, name) => {
    if (!window.confirm(`Delete playlist "${name}"?`)) return;
    try {
      await deletePlaylist(id);
      setPlaylists(playlists.filter((p) => p._id !== id));
    } catch (err) {
      setError('Failed to delete playlist.');
    }
  };

  const handleAddSong = async (playlistId) => {
    const songId = selectedSongs[playlistId];
    if (!songId) return setError('Please select a song to add.');
    setError('');
    try {
      const res = await addSongToPlaylist(playlistId, songId);
      setMessage('Song added to playlist!');
      // Update that playlist in state
      setPlaylists(playlists.map((p) => (p._id === playlistId ? res.data.playlist : p)));
      setSelectedSongs({ ...selectedSongs, [playlistId]: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add song.');
    }
  };

  const handleRemoveSong = async (playlistId, songId) => {
    try {
      const res = await removeSongFromPlaylist(playlistId, songId);
      setPlaylists(playlists.map((p) => (p._id === playlistId ? res.data.playlist : p)));
    } catch (err) {
      setError('Failed to remove song.');
    }
  };

  // Songs not yet in a given playlist (for the dropdown)
  const getAvailableSongs = (playlist) => {
    const inPlaylist = playlist.songs.map((s) => s._id);
    return songs.filter((s) => !inPlaylist.includes(s._id));
  };

  return (
    <div>
      {/* Create Playlist */}
      <div className="playlist-create">
        <input
          type="text"
          placeholder="New playlist name..."
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
        />
        <button className="btn btn-primary" onClick={handleCreatePlaylist}>
          + Create Playlist
        </button>
      </div>

      {message && <div className="success-msg mb-16">{message}</div>}
      {error && <div className="error-msg mb-16">{error}</div>}

      <h3 style={{ color: '#a78bfa', marginBottom: '14px' }}>
        Your Playlists ({playlists.length})
      </h3>

      {playlists.length === 0 && (
        <div className="empty-msg">No playlists yet. Create one above!</div>
      )}

      {playlists.map((playlist) => {
        const available = getAvailableSongs(playlist);
        return (
          <div key={playlist._id} className="playlist-card">
            <div className="playlist-header">
              <h3>📋 {playlist.name}</h3>
              <button
                className="btn btn-danger"
                onClick={() => handleDeletePlaylist(playlist._id, playlist.name)}
              >
                🗑 Delete
              </button>
            </div>

            {/* Songs in playlist */}
            {playlist.songs.length === 0 ? (
              <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '12px' }}>
                No songs yet.
              </p>
            ) : (
              playlist.songs.map((song) => (
                <div key={song._id} className="song-item">
                  <span>🎵</span>
                  <span className="song-name">
                    {song.title}{' '}
                    <span style={{ color: '#666', fontSize: '0.78rem' }}>
                      — {song.artist}
                    </span>
                  </span>
                  <button
                    className="btn btn-danger"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    onClick={() => handleRemoveSong(playlist._id, song._id)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}

            {/* Add song dropdown */}
            {available.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                <select
                  value={selectedSongs[playlist._id] || ''}
                  onChange={(e) =>
                    setSelectedSongs({ ...selectedSongs, [playlist._id]: e.target.value })
                  }
                >
                  <option value="">-- Select a song to add --</option>
                  {available.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.title} — {s.artist}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-success"
                  onClick={() => handleAddSong(playlist._id)}
                >
                  + Add Song
                </button>
              </div>
            )}

            {available.length === 0 && songs.length > 0 && playlist.songs.length === songs.length && (
              <p style={{ color: '#555', fontSize: '0.8rem', marginTop: '10px' }}>
                All your songs are already in this playlist.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PlaylistsTab;

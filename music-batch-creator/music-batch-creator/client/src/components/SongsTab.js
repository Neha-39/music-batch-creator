import React, { useState, useEffect, useRef } from 'react';
import { getSongs, uploadSong, deleteSong } from '../api';

function SongsTab() {
  const [songs, setSongs] = useState([]);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef(null);

  // Load songs on mount
  useEffect(() => {
    fetchSongs();
  }, []);

  // Auto-play when currentSong changes
  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play();
    }
  }, [currentSong]);

  const fetchSongs = async () => {
    try {
      const res = await getSongs();
      setSongs(res.data);
    } catch (err) {
      setError('Failed to load songs.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select an audio file.');
    setError('');
    setMessage('');
    setUploading(true);

    const formData = new FormData();
    formData.append('song', file);
    formData.append('title', title);
    formData.append('artist', artist);

    try {
      await uploadSong(formData);
      setMessage('Song uploaded successfully!');
      setTitle('');
      setArtist('');
      setFile(null);
      // Reset file input
      document.getElementById('file-input').value = '';
      fetchSongs();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this song?')) return;
    try {
      await deleteSong(id);
      setSongs(songs.filter((s) => s._id !== id));
      if (currentSong?._id === id) setCurrentSong(null);
    } catch (err) {
      setError('Failed to delete song.');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    return `${mb} MB`;
  };

  return (
    <div>
      {/* Upload Form */}
      <div className="upload-section">
        <h3>Upload a Song</h3>
        {message && <div className="success-msg">{message}</div>}
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleUpload}>
          <input
            type="text"
            placeholder="Song title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Artist name (optional)"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
          <input
            id="file-input"
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Song'}
          </button>
        </form>
      </div>

      {/* Songs List */}
      <h3 style={{ color: '#a78bfa', marginBottom: '14px' }}>
        Your Songs ({songs.length})
      </h3>

      {songs.length === 0 && (
        <div className="empty-msg">No songs yet. Upload your first song above!</div>
      )}

      {songs.map((song) => (
        <div
          key={song._id}
          className="card"
          style={{
            borderColor: currentSong?._id === song._id ? '#7c3aed' : '#2d2d4e',
          }}
        >
          <div style={{ fontSize: '1.6rem' }}>🎵</div>
          <div className="card-info">
            <h4>{song.title}</h4>
            <p>
              {song.artist} {song.size ? `• ${formatSize(song.size)}` : ''}
            </p>
          </div>
          <div className="card-actions">
            <button
              className="btn btn-primary"
              onClick={() => setCurrentSong(song)}
            >
              ▶ Play
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleDelete(song._id)}
            >
              🗑 Delete
            </button>
          </div>
        </div>
      ))}

      {/* Fixed Audio Player Bar */}
      {currentSong && (
        <div className="player-bar">
          <div className="player-info">
            <h4>{currentSong.title}</h4>
            <p>{currentSong.artist}</p>
          </div>
          <audio
            ref={audioRef}
            controls
            style={{ flex: 1 }}
            src={`http://localhost:5000${currentSong.filepath}`}
          />
          <button
            className="player-close"
            onClick={() => setCurrentSong(null)}
            title="Close player"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default SongsTab;

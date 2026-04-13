import React, { useState, useEffect, useCallback } from 'react';
import { MdSearch, MdFilterList, MdFileUpload } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { songsAPI } from '../api';
import { usePlayer } from '../context/PlayerContext';
import SongRow from '../components/songs/SongRow';
import toast from 'react-hot-toast';
import './SongsPage.css';

const GENRES = ['All','Pop','Rock','Hip-Hop','Jazz','Classical','Electronic','R&B','Country','Metal','Folk','Indie','Other'];

export default function SongsPage() {
  const navigate = useNavigate();
  const { playQueue } = usePlayer();

  const [songs, setSongs]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [genre, setGenre]       = useState('All');
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (genre !== 'All') params.genre = genre;
      const { data } = await songsAPI.getMy(params);
      setSongs(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load songs');
    } finally {
      setLoading(false);
    }
  }, [page, search, genre]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search, genre]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this song? This cannot be undone.')) return;
    try {
      await songsAPI.delete(id);
      toast.success('Song deleted');
      setSongs(prev => prev.filter(s => s._id !== id));
    } catch {
      toast.error('Failed to delete song');
    }
  };

  const handlePlayAll = () => {
    if (songs.length) playQueue(songs);
  };

  return (
    <div className="page songs-page">
      {/* Header */}
      <div className="page-header">
        <div className="songs-page__top">
          <div>
            <h1 className="page-title">My Songs</h1>
            <p className="page-subtitle">
              {pagination.total ? `${pagination.total} track${pagination.total !== 1 ? 's' : ''}` : 'Your music library'}
            </p>
          </div>
          <div className="songs-page__top-actions">
            {songs.length > 0 && (
              <button className="btn btn-ghost" onClick={handlePlayAll}>
                ▶ Play All
              </button>
            )}
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>
              <MdFileUpload /> Upload
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="songs-page__filters">
        <div className="songs-search">
          <MdSearch className="songs-search__icon" />
          <input
            className="songs-search__input"
            placeholder="Search your songs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="songs-genres">
          {GENRES.map(g => (
            <button
              key={g}
              className={`songs-genre-btn${genre === g ? ' active' : ''}`}
              onClick={() => { setGenre(g); setPage(1); }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Song list */}
      {loading ? (
        <div className="songs-skeleton">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 54, borderRadius: 8, animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎵</div>
          <div className="empty-state-title">
            {search || genre !== 'All' ? 'No matching songs' : 'No songs yet'}
          </div>
          <div className="empty-state-text">
            {search || genre !== 'All'
              ? 'Try a different search or genre filter'
              : 'Upload your first track to get started'}
          </div>
          {!search && genre === 'All' && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/upload')}>
              Upload Now
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="songs-grid">
            <div className="song-row-header">
              <div /><div />
              <div>Title</div>
              <div className="hide-mobile">Album</div>
              <div className="hide-tablet">Genre</div>
              <div style={{ textAlign: 'right' }}>Time</div>
              <div />
            </div>
            {songs.map((song, i) => (
              <SongRow
                key={song._id}
                song={song}
                index={i}
                queue={songs}
                onDelete={handleDelete}
                onEdit={(s) => navigate(`/upload?edit=${s._id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="songs-pagination">
              <button
                className="btn btn-ghost btn-sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Prev
              </button>
              <span className="songs-pagination__info">
                Page {page} of {pagination.pages}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page === pagination.pages}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

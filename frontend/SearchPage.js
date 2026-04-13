import React, { useState, useEffect, useCallback } from 'react';
import { MdSearch, MdMusicNote } from 'react-icons/md';
import { songsAPI } from '../api';
import SongRow from '../components/songs/SongRow';
import { usePlayer } from '../context/PlayerContext';
import './SearchPage.css';

const GENRES = ['All','Pop','Rock','Hip-Hop','Jazz','Classical','Electronic','R&B','Country','Metal','Folk','Indie','Other'];

export default function SearchPage() {
  const [query, setQuery]       = useState('');
  const [genre, setGenre]       = useState('All');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const { playQueue }           = usePlayer();

  const doSearch = useCallback(async () => {
    if (!query.trim() && genre === 'All') return;
    setLoading(true);
    setSearched(true);
    try {
      const params = { limit: 40 };
      if (query.trim()) params.q = query.trim();
      if (genre !== 'All') params.genre = genre;
      const { data } = await songsAPI.search(params);
      setResults(data.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, genre]);

  // Auto-search on genre change
  useEffect(() => {
    if (genre !== 'All') doSearch();
  }, [genre]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') doSearch();
  };

  return (
    <div className="page search-page">
      <div className="page-header">
        <h1 className="page-title">Search</h1>
        <p className="page-subtitle">Find songs by title, artist, or genre</p>
      </div>

      {/* Search bar */}
      <div className="search-bar">
        <MdSearch className="search-bar__icon" />
        <input
          className="search-bar__input"
          placeholder="Search songs, artists, albums…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button className="btn btn-primary" onClick={doSearch} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Search'}
        </button>
      </div>

      {/* Genre pills */}
      <div className="search-genres">
        {GENRES.map(g => (
          <button
            key={g}
            className={`songs-genre-btn${genre === g ? ' active' : ''}`}
            onClick={() => setGenre(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Results */}
      {!searched && !loading && (
        <div className="search-splash">
          <div className="search-splash__icon"><MdMusicNote /></div>
          <div className="search-splash__text">Start typing to search the public library</div>
        </div>
      )}

      {loading && (
        <div className="search-skeleton">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 54, borderRadius: 8 }} />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No results found</div>
          <div className="empty-state-text">Try a different query or genre</div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="search-results-header">
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => playQueue(results)}>
              ▶ Play All
            </button>
          </div>
          <div className="songs-grid">
            <div className="song-row-header">
              <div /><div />
              <div>Title</div>
              <div className="hide-mobile">Album</div>
              <div className="hide-tablet">Genre</div>
              <div style={{ textAlign: 'right' }}>Time</div>
              <div />
            </div>
            {results.map((song, i) => (
              <SongRow key={song._id} song={song} index={i} queue={results} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

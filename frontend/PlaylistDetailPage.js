import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MdPlayArrow, MdShuffle, MdShare, MdAdd, MdClose,
  MdLock, MdPublic, MdDelete, MdSearch,
} from 'react-icons/md';
import { playlistsAPI, songsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import SongRow from '../components/songs/SongRow';
import toast from 'react-hot-toast';
import './PlaylistDetailPage.css';

export default function PlaylistDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { playQueue, setIsShuffle } = usePlayer();

  const [playlist, setPlaylist]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [addModal, setAddModal]   = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await playlistsAPI.getOne(id);
      setPlaylist(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Playlist not found');
      navigate('/playlists');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const isOwner = user?._id === playlist?.createdBy?._id
    || user?.id === playlist?.createdBy?._id
    || user?.id === playlist?.createdBy;

  const songs = playlist?.songs?.map(s => s.song).filter(Boolean) || [];

  const handlePlay = () => { if (songs.length) playQueue(songs); };
  const handleShuffle = () => { setIsShuffle(true); if (songs.length) playQueue(songs, Math.floor(Math.random() * songs.length)); };

  const handleShare = () => {
    const url = `${window.location.origin}/playlist/share/${playlist.shareToken}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Share link copied!'));
  };

  const handleRemoveSong = async (songId) => {
    try {
      await playlistsAPI.removeSong(id, songId);
      setPlaylist(prev => ({
        ...prev,
        songs: prev.songs.filter(s => s.song?._id !== songId),
      }));
      toast.success('Song removed');
    } catch {
      toast.error('Failed to remove song');
    }
  };

  const handleAddSong = async (songId) => {
    try {
      const { data } = await playlistsAPI.addSong(id, songId);
      setPlaylist(data.data);
      toast.success('Song added!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add song');
    }
  };

  const totalDuration = songs.reduce((t, s) => t + (s?.duration || 0), 0);
  const fmtTotal = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  if (loading) return (
    <div className="page">
      <div className="playlist-detail-skeleton">
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 48, marginTop: 20 }} />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 52, marginTop: 8 }} />
        ))}
      </div>
    </div>
  );

  if (!playlist) return null;

  return (
    <div className="page playlist-detail-page">
      {/* Hero banner */}
      <div className="playlist-detail-hero">
        <div className="playlist-detail-cover">
          {playlist.coverImage
            ? <img src={`http://localhost:5000${playlist.coverImage}`} alt={playlist.name} />
            : (
              <div className="playlist-detail-cover__grid">
                {songs.slice(0, 4).map((s, i) => (
                  s?.thumbnailUrl
                    ? <img key={i} src={`http://localhost:5000${s.thumbnailUrl}`} alt="" />
                    : <div key={i} className="playlist-detail-cover__cell"><span>♪</span></div>
                ))}
                {songs.length === 0 && <div className="playlist-detail-cover__empty">♫</div>}
              </div>
            )
          }
        </div>
        <div className="playlist-detail-info">
          <div className="playlist-detail-type">
            {playlist.isPublic ? <MdPublic /> : <MdLock />}
            <span>{playlist.isPublic ? 'Public' : 'Private'} Playlist</span>
          </div>
          <h1 className="playlist-detail-name">{playlist.name}</h1>
          {playlist.description && (
            <p className="playlist-detail-desc">{playlist.description}</p>
          )}
          <div className="playlist-detail-meta">
            <span>by <strong>{playlist.createdBy?.username}</strong></span>
            <span>·</span>
            <span>{songs.length} songs</span>
            {totalDuration > 0 && <><span>·</span><span>{fmtTotal(totalDuration)}</span></>}
          </div>
          <div className="playlist-detail-actions">
            <button className="btn btn-primary btn-lg" onClick={handlePlay} disabled={!songs.length}>
              <MdPlayArrow /> Play All
            </button>
            <button className="btn btn-ghost" onClick={handleShuffle} disabled={!songs.length}>
              <MdShuffle /> Shuffle
            </button>
            {playlist.isPublic && (
              <button className="btn btn-ghost" onClick={handleShare}>
                <MdShare /> Share
              </button>
            )}
            {isOwner && (
              <button className="btn btn-ghost" onClick={() => setAddModal(true)}>
                <MdAdd /> Add Songs
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Song list */}
      <div className="playlist-detail-tracks">
        {songs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎶</div>
            <div className="empty-state-title">No songs in this playlist</div>
            <div className="empty-state-text">Add songs to build your batch</div>
            {isOwner && (
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setAddModal(true)}>
                Add Songs
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="song-row-header">
              <div /><div /><div>Title</div>
              <div className="hide-mobile">Album</div>
              <div className="hide-tablet">Genre</div>
              <div style={{ textAlign: 'right' }}>Time</div>
              <div />
            </div>
            {songs.map((song, i) => song && (
              <SongRow
                key={song._id}
                song={song}
                index={i}
                queue={songs}
                onDelete={isOwner ? () => handleRemoveSong(song._id) : undefined}
              />
            ))}
          </>
        )}
      </div>

      {/* Add songs modal */}
      {addModal && (
        <AddSongsModal
          playlistId={id}
          existingIds={songs.map(s => s._id)}
          onAdd={handleAddSong}
          onClose={() => setAddModal(false)}
        />
      )}
    </div>
  );
}

/* ── Add Songs Modal ───────────────────────────────────────── */
function AddSongsModal({ playlistId, existingIds, onAdd, onClose }) {
  const [mySongs, setMySongs] = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    songsAPI.getMy({ limit: 100 })
      .then(({ data }) => setMySongs(data.data))
      .catch(() => toast.error('Failed to load songs'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = mySongs.filter(s =>
    !existingIds.includes(s._id) &&
    (s.title.toLowerCase().includes(search.toLowerCase()) ||
     s.artist.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-songs-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Songs</h2>
          <button className="btn-icon" onClick={onClose}><MdClose /></button>
        </div>
        <div className="add-songs-search">
          <MdSearch className="add-songs-search__icon" />
          <input
            className="add-songs-search__input"
            placeholder="Search your songs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="add-songs-list">
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <span className="spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 20px' }}>
              <div className="empty-state-title">No songs to add</div>
              <div className="empty-state-text">All your songs are already in this playlist</div>
            </div>
          ) : (
            filtered.map(song => (
              <div className="add-songs-item" key={song._id}>
                <div className="add-songs-item__thumb">
                  {song.thumbnailUrl
                    ? <img src={`http://localhost:5000${song.thumbnailUrl}`} alt="" />
                    : <span>♪</span>
                  }
                </div>
                <div className="add-songs-item__info">
                  <div className="add-songs-item__title">{song.title}</div>
                  <div className="add-songs-item__artist">{song.artist}</div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { onAdd(song._id); onClose(); }}
                >
                  <MdAdd /> Add
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

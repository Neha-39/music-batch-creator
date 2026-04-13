import React, { useState } from 'react';
import {
  MdPlayArrow, MdPause, MdMoreVert, MdDelete,
  MdEdit, MdAddToQueue, MdQueueMusic, MdFlag,
} from 'react-icons/md';
import { usePlayer } from '../../context/PlayerContext';
import './SongRow.css';

export default function SongRow({
  song, index, queue, onDelete, onEdit, onAddToPlaylist, showUploader = false,
}) {
  const { playSong, playQueue, togglePlay, currentSong, isPlaying, addToQueue } = usePlayer();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = currentSong?._id === song._id;

  const handlePlay = () => {
    if (isActive) { togglePlay(); return; }
    if (queue) playQueue(queue, index);
    else playSong(song);
  };

  const fmt = (s) => {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`song-row${isActive ? ' song-row--active' : ''}`}>
      {/* Index / Play button */}
      <div className="song-row__num" onClick={handlePlay}>
        <span className="song-row__index">{index + 1}</span>
        <button className="song-row__play-btn">
          {isActive && isPlaying ? <MdPause /> : <MdPlayArrow />}
        </button>
      </div>

      {/* Thumbnail */}
      <div className="song-row__thumb">
        {song.thumbnailUrl
          ? <img src={`http://localhost:5000${song.thumbnailUrl}`} alt={song.title} />
          : <span className="song-row__thumb-ph">♪</span>
        }
      </div>

      {/* Info */}
      <div className="song-row__info" onClick={handlePlay}>
        <div className={`song-row__title${isActive ? ' active' : ''}`}>{song.title}</div>
        <div className="song-row__artist">{song.artist}</div>
      </div>

      {/* Album */}
      <div className="song-row__album hide-mobile">{song.album || '—'}</div>

      {/* Genre */}
      <div className="song-row__genre hide-tablet">
        <span className="badge badge-gray">{song.genre}</span>
      </div>

      {/* Duration */}
      <div className="song-row__dur">{fmt(song.duration)}</div>

      {/* Actions */}
      <div className="song-row__actions">
        <div className="song-row__menu-wrap">
          <button
            className="btn-icon"
            onClick={() => setMenuOpen(v => !v)}
          >
            <MdMoreVert />
          </button>
          {menuOpen && (
            <div className="song-row__menu" onMouseLeave={() => setMenuOpen(false)}>
              <button onClick={() => { addToQueue(song); setMenuOpen(false); }}>
                <MdAddToQueue /> Add to queue
              </button>
              {onAddToPlaylist && (
                <button onClick={() => { onAddToPlaylist(song); setMenuOpen(false); }}>
                  <MdQueueMusic /> Add to playlist
                </button>
              )}
              {onEdit && (
                <button onClick={() => { onEdit(song); setMenuOpen(false); }}>
                  <MdEdit /> Edit
                </button>
              )}
              {onDelete && (
                <button className="danger" onClick={() => { onDelete(song._id); setMenuOpen(false); }}>
                  <MdDelete /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

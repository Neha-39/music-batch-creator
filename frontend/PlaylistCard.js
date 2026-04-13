import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdPlayArrow, MdLock, MdPublic, MdMoreVert } from 'react-icons/md';
import { usePlayer } from '../../context/PlayerContext';
import './PlaylistCard.css';

export default function PlaylistCard({ playlist, onDelete, onEdit }) {
  const navigate = useNavigate();
  const { playQueue } = usePlayer();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const songs = playlist.songs
    ?.map(s => s.song)
    .filter(Boolean) || [];

  const handlePlayAll = (e) => {
    e.stopPropagation();
    if (songs.length) playQueue(songs);
  };

  return (
    <div
      className="playlist-card card clickable"
      onClick={() => navigate(`/playlists/${playlist._id}`)}
    >
      {/* Cover */}
      <div className="playlist-card__cover">
        {playlist.coverImage
          ? <img src={`http://localhost:5000${playlist.coverImage}`} alt={playlist.name} />
          : (
            <div className="playlist-card__cover-grid">
              {songs.slice(0, 4).map((s, i) => (
                s?.thumbnailUrl
                  ? <img key={i} src={`http://localhost:5000${s.thumbnailUrl}`} alt="" />
                  : <div key={i} className="playlist-card__cover-cell"><span>♪</span></div>
              ))}
              {songs.length === 0 && (
                <div className="playlist-card__cover-empty">♫</div>
              )}
            </div>
          )
        }
        <button className="playlist-card__play" onClick={handlePlayAll}>
          <MdPlayArrow />
        </button>
      </div>

      {/* Info */}
      <div className="playlist-card__info">
        <div className="playlist-card__name truncate">{playlist.name}</div>
        <div className="playlist-card__meta">
          <span>{songs.length} songs</span>
          <span className="playlist-card__vis">
            {playlist.isPublic ? <MdPublic /> : <MdLock />}
          </span>
        </div>
      </div>

      {/* Menu */}
      {(onEdit || onDelete) && (
        <div className="playlist-card__menu-wrap" onClick={e => e.stopPropagation()}>
          <button className="btn-icon playlist-card__more" onClick={() => setMenuOpen(v => !v)}>
            <MdMoreVert />
          </button>
          {menuOpen && (
            <div className="playlist-card__menu" onMouseLeave={() => setMenuOpen(false)}>
              {onEdit && <button onClick={() => { onEdit(playlist); setMenuOpen(false); }}>Edit</button>}
              {onDelete && <button className="danger" onClick={() => { onDelete(playlist._id); setMenuOpen(false); }}>Delete</button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

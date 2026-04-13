import React, { useRef } from 'react';
import {
  MdPlayArrow, MdPause, MdSkipNext, MdSkipPrevious,
  MdShuffle, MdRepeat, MdVolumeUp, MdVolumeOff,
  MdQueueMusic,
} from 'react-icons/md';
import { usePlayer } from '../../context/PlayerContext';
import './Player.css';

export default function PlayerBar() {
  const {
    currentSong, isPlaying, currentTime, duration,
    volume, isMuted, isRepeat, isShuffle, isLoading,
    togglePlay, playNext, playPrev,
    seek, setVolume, setIsMuted, setIsRepeat, setIsShuffle,
    formatTime,
  } = usePlayer();

  const progressRef = useRef();

  const handleProgressClick = (e) => {
    if (!duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
    setIsMuted(false);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`player-bar-root${currentSong ? ' active' : ''}`}>
      {/* Progress bar on top */}
      <div
        className="player-progress-track"
        ref={progressRef}
        onClick={handleProgressClick}
      >
        <div className="player-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="player-inner">
        {/* Song info */}
        <div className="player-song-info">
          <div className="player-thumb">
            {currentSong?.thumbnailUrl
              ? <img src={`http://localhost:5000${currentSong.thumbnailUrl}`} alt="" />
              : <span className="player-thumb-placeholder">♪</span>
            }
          </div>
          <div className="player-meta">
            <div className="player-title truncate">
              {currentSong ? currentSong.title : 'Not playing'}
            </div>
            <div className="player-artist truncate">
              {currentSong ? currentSong.artist : '—'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="player-controls">
          <button
            className={`player-ctrl-btn${isShuffle ? ' active' : ''}`}
            onClick={() => setIsShuffle(v => !v)}
            title="Shuffle"
          >
            <MdShuffle />
          </button>
          <button className="player-ctrl-btn" onClick={playPrev} title="Previous">
            <MdSkipPrevious />
          </button>
          <button
            className="player-play-btn"
            onClick={togglePlay}
            disabled={!currentSong}
          >
            {isLoading
              ? <span className="spinner" style={{ width: 18, height: 18 }} />
              : isPlaying ? <MdPause /> : <MdPlayArrow />
            }
          </button>
          <button className="player-ctrl-btn" onClick={playNext} title="Next">
            <MdSkipNext />
          </button>
          <button
            className={`player-ctrl-btn${isRepeat ? ' active' : ''}`}
            onClick={() => setIsRepeat(v => !v)}
            title="Repeat"
          >
            <MdRepeat />
          </button>
        </div>

        {/* Time + Volume */}
        <div className="player-right">
          <span className="player-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <button
            className="player-ctrl-btn"
            onClick={() => setIsMuted(v => !v)}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <MdVolumeOff /> : <MdVolumeUp />}
          </button>
          <input
            type="range"
            className="player-volume"
            min="0" max="1" step="0.02"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            title="Volume"
          />
        </div>
      </div>
    </div>
  );
}

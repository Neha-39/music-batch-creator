import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { songsAPI } from '../api';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const audioRef              = useRef(new Audio());
  const [queue, setQueue]     = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [currentTime, setCurrentTime]   = useState(0);
  const [duration, setDuration]         = useState(0);
  const [volume, setVolume]             = useState(0.8);
  const [isMuted, setIsMuted]           = useState(false);
  const [isRepeat, setIsRepeat]         = useState(false);
  const [isShuffle, setIsShuffle]       = useState(false);
  const [isLoading, setIsLoading]       = useState(false);

  const currentSong = queue[currentIndex] || null;

  // ── Wire up audio events ────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate  = () => setCurrentTime(audio.currentTime);
    const onDuration    = () => setDuration(audio.duration || 0);
    const onEnded       = () => {
      if (isRepeat) { audio.currentTime = 0; audio.play(); return; }
      if (isShuffle) { playRandom(); return; }
      playNext();
    };
    const onWaiting     = () => setIsLoading(true);
    const onCanPlay     = () => setIsLoading(false);
    const onPlay        = () => setIsPlaying(true);
    const onPause       = () => setIsPlaying(false);

    audio.addEventListener('timeupdate',      onTimeUpdate);
    audio.addEventListener('loadedmetadata',  onDuration);
    audio.addEventListener('ended',           onEnded);
    audio.addEventListener('waiting',         onWaiting);
    audio.addEventListener('canplay',         onCanPlay);
    audio.addEventListener('play',            onPlay);
    audio.addEventListener('pause',           onPause);

    return () => {
      audio.removeEventListener('timeupdate',     onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onDuration);
      audio.removeEventListener('ended',          onEnded);
      audio.removeEventListener('waiting',        onWaiting);
      audio.removeEventListener('canplay',        onCanPlay);
      audio.removeEventListener('play',           onPlay);
      audio.removeEventListener('pause',          onPause);
    };
  }, [isRepeat, isShuffle, currentIndex, queue.length]);

  // ── Sync volume ─────────────────────────────────────────────
  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const loadAndPlay = useCallback((index) => {
    if (index < 0 || index >= queue.length) return;
    const song = queue[index];
    const audio = audioRef.current;
    const url = songsAPI.stream(song._id);
    if (audio.src !== url) {
      audio.src = url;
      audio.load();
    }
    audio.play().catch(() => {});
    setCurrentIndex(index);
  }, [queue]);

  const playSong = useCallback((song, newQueue = null) => {
    const targetQueue = newQueue || queue;
    if (newQueue) setQueue(newQueue);
    const idx = targetQueue.findIndex(s => s._id === song._id);
    const finalIdx = idx >= 0 ? idx : 0;
    if (newQueue) {
      setTimeout(() => loadAndPlay(finalIdx), 0);
    } else {
      loadAndPlay(finalIdx);
    }
  }, [queue, loadAndPlay]);

  const playQueue = useCallback((songs, startIndex = 0) => {
    setQueue(songs);
    setTimeout(() => loadAndPlay(startIndex), 0);
  }, [loadAndPlay]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!currentSong) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, [currentSong]);

  const playNext = useCallback(() => {
    if (!queue.length) return;
    const next = (currentIndex + 1) % queue.length;
    loadAndPlay(next);
  }, [currentIndex, queue.length, loadAndPlay]);

  const playPrev = useCallback(() => {
    if (!queue.length) return;
    const audio = audioRef.current;
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    const prev = (currentIndex - 1 + queue.length) % queue.length;
    loadAndPlay(prev);
  }, [currentIndex, queue.length, loadAndPlay]);

  const playRandom = useCallback(() => {
    if (queue.length <= 1) return;
    let idx;
    do { idx = Math.floor(Math.random() * queue.length); } while (idx === currentIndex);
    loadAndPlay(idx);
  }, [queue.length, currentIndex, loadAndPlay]);

  const seek = useCallback((time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const addToQueue = useCallback((song) => {
    setQueue(prev => {
      if (prev.find(s => s._id === song._id)) return prev;
      return [...prev, song];
    });
  }, []);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <PlayerContext.Provider value={{
      currentSong, queue, currentIndex,
      isPlaying, currentTime, duration,
      volume, isMuted, isRepeat, isShuffle, isLoading,
      playSong, playQueue, togglePlay, playNext, playPrev,
      seek, addToQueue, setVolume, setIsMuted, setIsRepeat, setIsShuffle,
      formatTime,
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
};

import axios from 'axios';

// Base URL — uses React's proxy in dev, or change to your deployed server URL
const API = axios.create({ baseURL: '/api' });

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AUTH
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

// SONGS
export const uploadSong = (formData) =>
  API.post('/songs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getSongs = () => API.get('/songs');
export const deleteSong = (id) => API.delete(`/songs/${id}`);

// PLAYLISTS
export const getPlaylists = () => API.get('/playlists');
export const createPlaylist = (data) => API.post('/playlists', data);
export const addSongToPlaylist = (playlistId, songId) =>
  API.post(`/playlists/${playlistId}/songs`, { songId });
export const removeSongFromPlaylist = (playlistId, songId) =>
  API.delete(`/playlists/${playlistId}/songs/${songId}`);
export const deletePlaylist = (id) => API.delete(`/playlists/${id}`);

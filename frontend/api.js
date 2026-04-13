import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// ── Request interceptor: attach JWT ──────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('mbc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: handle 401 ─────────────────────────
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mbc_token');
      localStorage.removeItem('mbc_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register:        (data) => API.post('/auth/register', data),
  login:           (data) => API.post('/auth/login', data),
  logout:          ()     => API.get('/auth/logout'),
  getMe:           ()     => API.get('/auth/me'),
  updateProfile:   (data) => API.put('/auth/updateprofile', data),
  updatePassword:  (data) => API.put('/auth/updatepassword', data),
  forgotPassword:  (data) => API.post('/auth/forgotpassword', data),
  resetPassword:   (token, data) => API.put(`/auth/resetpassword/${token}`, data),
  verifyEmail:     (token) => API.get(`/auth/verifyemail/${token}`),
};

// ── Songs ─────────────────────────────────────────────────────
export const songsAPI = {
  getAll:    (params) => API.get('/songs', { params }),
  getMy:     (params) => API.get('/songs/my', { params }),
  getOne:    (id)     => API.get(`/songs/${id}`),
  upload:    (data, onProgress) => API.post('/songs', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  }),
  update:    (id, data) => API.put(`/songs/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete:    (id)     => API.delete(`/songs/${id}`),
  search:    (params) => API.get('/songs/search', { params }),
  stream:    (id)     => `${API.defaults.baseURL}/songs/${id}/stream`,
};

// ── Playlists ─────────────────────────────────────────────────
export const playlistsAPI = {
  getAll:          (params) => API.get('/playlists', { params }),
  getMy:           (params) => API.get('/playlists/my', { params }),
  getOne:          (id)     => API.get(`/playlists/${id}`),
  getByToken:      (token)  => API.get(`/playlists/share/${token}`),
  create:          (data)   => API.post('/playlists', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update:          (id, data) => API.put(`/playlists/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete:          (id)     => API.delete(`/playlists/${id}`),
  addSong:         (id, songId) => API.post(`/playlists/${id}/songs`, { songId }),
  removeSong:      (id, songId) => API.delete(`/playlists/${id}/songs/${songId}`),
  reorder:         (id, order)  => API.put(`/playlists/${id}/reorder`, { order }),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  getStats:        ()       => API.get('/admin/stats'),
  getUsers:        (params) => API.get('/admin/users', { params }),
  getUserById:     (id)     => API.get(`/admin/users/${id}`),
  updateStatus:    (id, isActive) => API.put(`/admin/users/${id}/status`, { isActive }),
  updateRole:      (id, role)     => API.put(`/admin/users/${id}/role`, { role }),
  getAllSongs:      (params) => API.get('/admin/songs', { params }),
  getFlaggedSongs: ()       => API.get('/admin/songs/flagged'),
  flagSong:        (id, reason)   => API.put(`/admin/songs/${id}/flag`, { reason }),
  unflagSong:      (id)     => API.put(`/admin/songs/${id}/unflag`),
  deleteSong:      (id)     => API.delete(`/admin/songs/${id}`),
};

export default API;

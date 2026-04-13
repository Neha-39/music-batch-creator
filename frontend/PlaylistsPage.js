import React, { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdClose, MdSearch } from 'react-icons/md';
import { playlistsAPI } from '../api';
import PlaylistCard from '../components/playlists/PlaylistCard';
import toast from 'react-hot-toast';
import './PlaylistsPage.css';

export default function PlaylistsPage() {
  const [playlists, setPlaylists]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (search) params.search = search;
      const { data } = await playlistsAPI.getMy(params);
      setPlaylists(data.data);
    } catch {
      toast.error('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this playlist?')) return;
    try {
      await playlistsAPI.delete(id);
      toast.success('Playlist deleted');
      setPlaylists(prev => prev.filter(p => p._id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSaved = (playlist, isEdit) => {
    if (isEdit) {
      setPlaylists(prev => prev.map(p => p._id === playlist._id ? playlist : p));
    } else {
      setPlaylists(prev => [playlist, ...prev]);
    }
    setModalOpen(false);
    setEditTarget(null);
  };

  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit   = (pl)  => { setEditTarget(pl);  setModalOpen(true); };

  return (
    <div className="page playlists-page">
      {/* Header */}
      <div className="page-header">
        <div className="playlists-top">
          <div>
            <h1 className="page-title">My Playlists</h1>
            <p className="page-subtitle">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <MdAdd /> New Playlist
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="playlists-search">
        <MdSearch className="playlists-search__icon" />
        <input
          className="playlists-search__input"
          placeholder="Search playlists..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="cards-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '1.1', borderRadius: 12 }} />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">{search ? 'No matching playlists' : 'No playlists yet'}</div>
          <div className="empty-state-text">Create your first batch playlist to organize your tracks</div>
          {!search && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={openCreate}>
              Create Playlist
            </button>
          )}
        </div>
      ) : (
        <div className="cards-grid">
          {playlists.map(pl => (
            <PlaylistCard
              key={pl._id}
              playlist={pl}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <PlaylistModal
          playlist={editTarget}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

/* ── Playlist Modal ────────────────────────────────────────── */
function PlaylistModal({ playlist, onClose, onSaved }) {
  const isEdit = !!playlist;
  const [form, setForm] = useState({
    name: playlist?.name || '',
    description: playlist?.description || '',
    isPublic: playlist?.isPublic ?? false,
    genre: playlist?.genre || 'Mixed',
    tags: playlist?.tags?.join(', ') || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      let result;
      if (isEdit) {
        const { data } = await playlistsAPI.update(playlist._id, fd);
        result = data.data;
        toast.success('Playlist updated!');
      } else {
        const { data } = await playlistsAPI.create(fd);
        result = data.data;
        toast.success('Playlist created! 🎵');
      }
      onSaved(result, isEdit);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Playlist' : 'New Playlist'}</h2>
          <button className="btn-icon" onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              className="form-input" autoFocus
              placeholder="My Awesome Playlist"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="What's this playlist about?"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tags</label>
            <input
              className="form-input"
              placeholder="chill, study, workout"
              value={form.tags}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Visibility</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[true, false].map(val => (
                <button
                  key={String(val)}
                  type="button"
                  className={`upload-privacy__opt${form.isPublic === val ? ' active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, isPublic: val }))}
                >
                  {val ? '🌍 Public' : '🔒 Private'}
                </button>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : isEdit ? 'Save Changes' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { MdPeople, MdAudiotrack, MdQueueMusic, MdFlag, MdDelete, MdCheck, MdBlock } from 'react-icons/md';
import { adminAPI } from '../api';
import toast from 'react-hot-toast';
import './AdminPage.css';

export default function AdminPage() {
  const [stats, setStats]         = useState(null);
  const [tab, setTab]             = useState('overview');
  const [users, setUsers]         = useState([]);
  const [songs, setSongs]         = useState([]);
  const [flagged, setFlagged]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => { loadStats(); }, []);
  useEffect(() => {
    if (tab === 'users') loadUsers();
    if (tab === 'songs') loadSongs();
    if (tab === 'flagged') loadFlagged();
  }, [tab]);

  const loadStats = async () => {
    try {
      const { data } = await adminAPI.getStats();
      setStats(data.data);
    } catch { toast.error('Failed to load stats'); }
    finally { setLoading(false); }
  };

  const loadUsers = async () => {
    try {
      const { data } = await adminAPI.getUsers({ limit: 50 });
      setUsers(data.data);
    } catch { toast.error('Failed to load users'); }
  };

  const loadSongs = async () => {
    try {
      const { data } = await adminAPI.getAllSongs({ limit: 50 });
      setSongs(data.data);
    } catch { toast.error('Failed to load songs'); }
  };

  const loadFlagged = async () => {
    try {
      const { data } = await adminAPI.getFlaggedSongs();
      setFlagged(data.data);
    } catch { toast.error('Failed to load flagged songs'); }
  };

  const toggleUserStatus = async (user) => {
    try {
      await adminAPI.updateStatus(user._id, !user.isActive);
      setUsers(prev => prev.map(u =>
        u._id === user._id ? { ...u, isActive: !u.isActive } : u
      ));
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
    } catch { toast.error('Failed to update user'); }
  };

  const handleAdminDelete = async (id) => {
    if (!window.confirm('Permanently delete this song?')) return;
    try {
      await adminAPI.deleteSong(id);
      setSongs(prev => prev.filter(s => s._id !== id));
      setFlagged(prev => prev.filter(s => s._id !== id));
      toast.success('Song deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleUnflag = async (id) => {
    try {
      await adminAPI.unflagSong(id);
      setFlagged(prev => prev.filter(s => s._id !== id));
      toast.success('Song unflagged');
    } catch { toast.error('Failed to unflag'); }
  };

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'users',    label: 'Users' },
    { id: 'songs',    label: 'All Songs' },
    { id: 'flagged',  label: `Flagged${stats ? ` (${stats.totals.flaggedSongs})` : ''}` },
  ];

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="page admin-page">
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Platform management and moderation</p>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`admin-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="admin-overview animate-fade-in">
          {loading ? (
            <div className="admin-stats-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
              ))}
            </div>
          ) : stats && (
            <>
              <div className="admin-stats-grid">
                {[
                  { label: 'Total Users',     value: stats.totals.users,       icon: MdPeople,     color: '#5292e0' },
                  { label: 'Total Songs',     value: stats.totals.songs,       icon: MdAudiotrack, color: 'var(--gold)' },
                  { label: 'Total Playlists', value: stats.totals.playlists,   icon: MdQueueMusic, color: '#52c97a' },
                  { label: 'Flagged Songs',   value: stats.totals.flaggedSongs,icon: MdFlag,       color: 'var(--red)' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div className="admin-stat-card card" key={label}>
                    <div className="admin-stat-card__icon" style={{ color, background: `${color}18` }}>
                      <Icon />
                    </div>
                    <div>
                      <div className="admin-stat-card__value">{value}</div>
                      <div className="admin-stat-card__label">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-two-col">
                {/* Genre breakdown */}
                <div className="card admin-chart-card">
                  <h3 className="admin-chart-title">Songs by Genre</h3>
                  <div className="admin-genre-bars">
                    {stats.genreBreakdown.slice(0, 8).map(({ _id, count }) => {
                      const max = stats.genreBreakdown[0]?.count || 1;
                      return (
                        <div className="admin-genre-bar" key={_id}>
                          <span className="admin-genre-bar__label">{_id || 'Other'}</span>
                          <div className="admin-genre-bar__track">
                            <div
                              className="admin-genre-bar__fill"
                              style={{ width: `${(count / max) * 100}%` }}
                            />
                          </div>
                          <span className="admin-genre-bar__count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent users */}
                <div className="card admin-chart-card">
                  <h3 className="admin-chart-title">Recent Users</h3>
                  <div className="admin-user-list">
                    {stats.recentUsers.map(u => (
                      <div className="admin-user-item" key={u._id}>
                        <div className="admin-user-avatar">{u.username[0].toUpperCase()}</div>
                        <div className="admin-user-info">
                          <div className="admin-user-name">{u.username}</div>
                          <div className="admin-user-email">{u.email}</div>
                        </div>
                        <span className={`badge ${u.role === 'admin' ? 'badge-gold' : 'badge-gray'}`}>
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top songs */}
              <div className="card admin-chart-card" style={{ marginTop: 20 }}>
                <h3 className="admin-chart-title">Top Played Songs</h3>
                <div className="admin-top-songs">
                  {stats.topSongs.map((song, i) => (
                    <div className="admin-top-song" key={song._id}>
                      <span className="admin-top-song__rank">#{i + 1}</span>
                      <div className="admin-top-song__info">
                        <div className="admin-top-song__title">{song.title}</div>
                        <div className="admin-top-song__artist">{song.artist}</div>
                      </div>
                      <span className="admin-top-song__plays">{song.playCount} plays</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div className="animate-fade-in">
          <input
            className="form-input admin-search"
            placeholder="Search users by name or email…"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
          />
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th><th>Email</th><th>Role</th>
                  <th>Uploads</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="admin-table-user">
                        <div className="admin-user-avatar sm">{u.username[0].toUpperCase()}</div>
                        <span>{u.username}</span>
                      </div>
                    </td>
                    <td className="admin-table-muted">{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-gold' : 'badge-gray'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="admin-table-muted">{u.totalUploads}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                        {u.isActive ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-ghost'}`}
                        onClick={() => toggleUserStatus(u)}
                      >
                        {u.isActive ? <><MdBlock /> Ban</> : <><MdCheck /> Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Songs tab */}
      {tab === 'songs' && (
        <div className="animate-fade-in">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Song</th><th>Artist</th><th>Uploader</th><th>Genre</th><th>Plays</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {songs.map(s => (
                  <tr key={s._id}>
                    <td className="admin-table-bold">{s.title}</td>
                    <td className="admin-table-muted">{s.artist}</td>
                    <td className="admin-table-muted">{s.uploadedBy?.username}</td>
                    <td><span className="badge badge-gray">{s.genre}</span></td>
                    <td className="admin-table-muted">{s.playCount}</td>
                    <td>
                      {s.isFlagged
                        ? <span className="badge badge-red">Flagged</span>
                        : <span className="badge badge-green">OK</span>
                      }
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleAdminDelete(s._id)}>
                        <MdDelete /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flagged tab */}
      {tab === 'flagged' && (
        <div className="animate-fade-in">
          {flagged.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-title">No flagged content</div>
              <div className="empty-state-text">All clear — nothing needs moderation</div>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Song</th><th>Uploader</th><th>Reason</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {flagged.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div>
                          <div className="admin-table-bold">{s.title}</div>
                          <div className="admin-table-muted" style={{ fontSize: '0.75rem' }}>{s.artist}</div>
                        </div>
                      </td>
                      <td className="admin-table-muted">{s.uploadedBy?.username}</td>
                      <td className="admin-table-muted">{s.flagReason || '—'}</td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleUnflag(s._id)}>
                          <MdCheck /> Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAdminDelete(s._id)}>
                          <MdDelete /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MdDashboard, MdAudiotrack, MdQueueMusic,
  MdSearch, MdFileUpload, MdAdminPanelSettings,
  MdLogout, MdPerson,
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: MdDashboard,   label: 'Dashboard' },
  { to: '/songs',     icon: MdAudiotrack,  label: 'My Songs' },
  { to: '/playlists', icon: MdQueueMusic,  label: 'Playlists' },
  { to: '/search',    icon: MdSearch,      label: 'Search' },
  { to: '/upload',    icon: MdFileUpload,  label: 'Upload' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">♪</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">MBC</span>
          <span className="sidebar-logo-sub">Music Batch Creator</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <Icon className="sidebar-link-icon" />
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="sidebar-section-label" style={{ marginTop: 24 }}>Admin</div>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
            >
              <MdAdminPanelSettings className="sidebar-link-icon" />
              <span>Admin Panel</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {user?.avatar
            ? <img src={`http://localhost:5000${user.avatar}`} alt={user.username} />
            : <span>{user?.username?.[0]?.toUpperCase()}</span>
          }
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name truncate">{user?.username}</div>
          <div className="sidebar-user-role">{user?.role}</div>
        </div>
        <button
          className="btn-icon sidebar-logout"
          onClick={handleLogout}
          title="Logout"
        >
          <MdLogout />
        </button>
      </div>
    </aside>
  );
}

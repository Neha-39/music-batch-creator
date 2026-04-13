import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';

// Layout
import Sidebar   from './components/layout/Sidebar';
import PlayerBar from './components/player/PlayerBar';

// Pages
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordPages';
import DashboardPage      from './pages/DashboardPage';
import SongsPage          from './pages/SongsPage';
import UploadPage         from './pages/UploadPage';
import PlaylistsPage      from './pages/PlaylistsPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import SearchPage         from './pages/SearchPage';
import AdminPage          from './pages/AdminPage';

// ── Guards ────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

// ── App Shell (authenticated layout) ─────────────────────────
function AppShell({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
      <div className="player-bar">
        <PlayerBar />
      </div>
    </div>
  );
}

// ── Full-page loader ──────────────────────────────────────────
function FullPageLoader() {
  return (
    <div style={{
      height: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48,
          background: 'var(--gold)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', margin: '0 auto 16px',
          animation: 'spin 2s linear infinite',
        }}>♪</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading…</div>
      </div>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Public shared playlist */}
      <Route path="/playlist/share/:token" element={<PlaylistDetailPage shared />} />

      {/* Protected */}
      <Route path="/dashboard" element={
        <ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>
      } />
      <Route path="/songs" element={
        <ProtectedRoute><AppShell><SongsPage /></AppShell></ProtectedRoute>
      } />
      <Route path="/upload" element={
        <ProtectedRoute><AppShell><UploadPage /></AppShell></ProtectedRoute>
      } />
      <Route path="/playlists" element={
        <ProtectedRoute><AppShell><PlaylistsPage /></AppShell></ProtectedRoute>
      } />
      <Route path="/playlists/:id" element={
        <ProtectedRoute><AppShell><PlaylistDetailPage /></AppShell></ProtectedRoute>
      } />
      <Route path="/search" element={
        <ProtectedRoute><AppShell><SearchPage /></AppShell></ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <AdminRoute><AppShell><AdminPage /></AppShell></AdminRoute>
      } />

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ── Root ──────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <AppRoutes />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#1c1c1c',
                color: '#f0ece4',
                border: '1px solid #2a2a2a',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontFamily: "'DM Sans', sans-serif",
              },
              success: {
                iconTheme: { primary: '#f5a623', secondary: '#0c0c0c' },
              },
              error: {
                iconTheme: { primary: '#e05252', secondary: '#fff' },
              },
            }}
          />
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

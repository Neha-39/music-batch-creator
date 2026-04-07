import React from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <h1>🎵 Music Batch Creator</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user && <span>Hello, {user.username}!</span>}
        {user ? (
          <button onClick={handleLogout}>Logout</button>
        ) : (
          <>
            <button onClick={() => navigate('/login')}>Login</button>
            <button onClick={() => navigate('/register')}>Register</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

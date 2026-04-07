import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';

function App() {
  // Store user + token in state (loaded from localStorage on start)
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Re-hydrate auth state from localStorage on page reload
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />}
        />
        <Route
          path="/register"
          element={!user ? <RegisterPage onLogin={handleLogin} /> : <Navigate to="/" />}
        />

        {/* Protected route */}
        <Route
          path="/"
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;

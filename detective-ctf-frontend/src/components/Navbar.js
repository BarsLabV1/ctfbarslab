import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-text">DEDEKTIF</span>
          <span className="brand-sub">// CTF</span>
        </Link>

        {user && (
          <>
            {/* Nav links */}
            <div className="navbar-links">
              <Link to="/cases" className={`nav-link ${isActive('/cases') ? 'active' : ''}`}>
                <span className="nav-link-prefix">01</span> VAKALAR
              </Link>
              <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`}>
                <span className="nav-link-prefix">02</span> SIRALAMALAR
              </Link>
              {user.isAdmin && (
                <Link to="/admin" className="nav-link nav-link-admin">
                  <span className="nav-link-prefix">⚙</span> ADMIN
                </Link>
              )}
            </div>

            {/* User info */}
            <div className="navbar-user">
              <div className="user-score">
                <span className="score-label">INTEL</span>
                <span className="score-value">{user.totalScore?.toLocaleString() || 0}</span>
              </div>
              <div className="user-badge">
                <span className="user-avatar">{user.username?.charAt(0).toUpperCase()}</span>
                <span className="user-name">{user.username?.toUpperCase()}</span>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                ⏻
              </button>
            </div>
          </>
        )}

        {!user && (
          <div className="navbar-auth">
            <Link to="/login" className="btn btn-secondary btn-small">GİRİŞ</Link>
            <Link to="/register" className="btn btn-primary btn-small">KAYIT</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

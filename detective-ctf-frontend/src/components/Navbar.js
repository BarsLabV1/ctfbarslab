import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            🕵️ Dedektif CTF
          </Link>
          
          <div className="navbar-links">
            {user ? (
              <>
                <Link to="/cases" className="nav-link">Senaryolar</Link>
                <Link to="/leaderboard" className="nav-link">Liderlik Tablosu</Link>
                {user.isAdmin && (
                  <Link to="/admin" className="nav-link nav-link-admin">Admin</Link>
                )}
                <div className="user-info">
                  <span className="username">👤 {user.username}</span>
                  <span className="score">⭐ {user.totalScore} puan</span>
                  <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                    Çıkış
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary btn-sm">Giriş</Link>
                <Link to="/register" className="btn btn-secondary btn-sm">Kayıt Ol</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

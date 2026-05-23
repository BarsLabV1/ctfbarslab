import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import './Navbar.css';

/* -- BarsBox: Sanal Makine Widget -- */
const KaliWidget = () => {
  const { showToast } = useToast();
  const [kaliData, setKaliData] = useState(null);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const vncUrl = kaliData
    ? `http://${kaliData.ipAddress}:${kaliData.kaliPort}/vnc.html?autoconnect=true&resize=scale&clipboard=1`
    : null;

  const startKali = async () => {
    setStarting(true);
    setDropdownOpen(true);
    try {
      const res = await api.post('/challenges/start-kali-standalone');
      setKaliData(res.data);
      showToast('BarsBox başlatıldı!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'BarsBox başlatılamadı', 'error');
    } finally {
      setStarting(false);
    }
  };

  const stopKali = async () => {
    setStopping(true);
    try {
      await api.post('/challenges/stop-kali-standalone');
      setKaliData(null);
      setDropdownOpen(false);
      showToast('BarsBox durduruldu', 'info');
    } catch {
      showToast('Durdurulamadı', 'error');
    } finally {
      setStopping(false);
    }
  };

  const handleBtnClick = () => {
    if (kaliData) {
      // Makine zaten çalışıyorsa dropdown aç/kapat
      setDropdownOpen(prev => !prev);
    } else if (!starting) {
      // Makine yoksa başlat
      startKali();
    }
  };

  const openInNewTab = () => {
    if (vncUrl) window.open(vncUrl, '_blank');
  };

  return (
    <div className="kali-widget">
      <button
        className={`kali-widget-btn ${kaliData ? 'running' : ''} ${starting ? 'starting' : ''}`}
        onClick={handleBtnClick}
        disabled={starting}
      >
        {starting ? (
          <>⏳ Başlatılıyor...</>
        ) : kaliData ? (
          <>🖥️ BARSBOX <span className="kali-dot-sm" /></>
        ) : (
          <>🖥️ BARSBOX</>
        )}
      </button>

      {dropdownOpen && (
        <div className="kali-widget-dropdown">
          {starting && !kaliData && (
            <div className="kali-widget-desc">
              ⏳ BarsBox başlatılıyor, lütfen bekleyin... (~15sn)
            </div>
          )}

          {kaliData && (
            <div className="kali-widget-active">
              <div className="kali-widget-status">
                <span className="kali-dot-lg" /> BARSBOX ÇALIŞIYOR
              </div>
              <div className="kali-widget-port">
                Adres: <code>{kaliData.ipAddress}:{kaliData.kaliPort}</code>
              </div>
              <button className="kali-widget-open" onClick={openInNewTab}>
                🖥️ Makineyi Aç
              </button>
              <button className="kali-widget-stop" onClick={stopKali} disabled={stopping}>
                {stopping ? '⏳ Durduruluyor...' : '⏹ Durdur'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
        <Link to="/" className="navbar-brand">
          <img
            src={`${process.env.PUBLIC_URL}/barslab-logo.png`}
            alt="BarsLab"
            style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span className="brand-text">BarsLab</span>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, fontFamily: 'monospace', textTransform: 'uppercase' }}>CTF Platform</span>
          </div>
        </Link>

        {user && (
          <>
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

            <div className="navbar-user">
              {/* BarsBox widget */}
              <KaliWidget />

              <div className="user-score">
                <span className="score-label">PUAN</span>
                <span className="score-value">{user.totalScore?.toLocaleString() || 0}</span>
              </div>
              <div className="user-badge">
                <span className="user-avatar">{user.username?.charAt(0).toUpperCase()}</span>
                <span className="user-name">{user.username?.toUpperCase()}</span>
              </div>
              <button onClick={handleLogout} className="logout-btn" title="Çıkış">⏻</button>
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

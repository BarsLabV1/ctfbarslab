import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const CHARS = [
  { icon: '🔍', name: 'OSINT',     desc: 'Açık kaynak istihbaratı. Sosyal ayak izlerini ve metadata\'yı takip et.', diff: 'ORTA',      color: '#00d4ff' },
  { icon: '🌐', name: 'WEB_EXPLOIT',desc: 'SQL injection, XSS ve kırık auth senin araçların.',                      diff: 'YÜKSEK',    color: '#f5c518' },
  { icon: '🔬', name: 'FORENSICS',  desc: 'Suç mahallini hafıza dökümlerinden yeniden oluştur.',                    diff: 'AŞIRI',     color: '#ff3b3b' },
  { icon: '⚙️', name: 'REV_ENG',   desc: 'Binary\'leri parçala, şifreyi çöz. Kodu yaratıcısından iyi anla.',       diff: 'İNSANÜSTÜ', color: '#00ff88' },
];

const FEED = [
  { time: '04:02:11', text: 'Yeni vaka dosyası yüklendi: 23:17\'den Sonra',           color: '#f5c518' },
  { time: '03:44:12', text: 'Sistem: Şifreli bağlantı kuruldu — AES-256-XTS',         color: '#00d4ff' },
  { time: '02:18:55', text: 'Uyarı: Yetkisiz tarama tespit edildi — subnet 10.0.x.x', color: '#ff3b3b' },
  { time: '01:33:07', text: 'Operatör soruşturmayı tamamladı: Dijital İz',            color: '#00ff88' },
  { time: '00:47:22', text: 'FLAG_CAPTURED: case_04 — 1200 intel puanı eklendi',      color: '#f5c518' },
];

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home">
      {/* ── Hero ── */}
      <div className="home-hero">
        <div className="hero-bg-img" />
        <div className="hero-bg-grid" />
        <div className="hero-scanline" />
        <div className="hero-vignette" />

        {/* Sidebar */}
        <div className="hero-sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-text">DEDEKTIF</div>
            <div className="sidebar-logo-sub">// NOIR_OS V2.4</div>
          </div>
          <nav className="sidebar-nav">
            <Link to="/"       className="sidebar-nav-item active"><span className="nav-icon">⬛</span>ANA</Link>
            <Link to="/cases"  className="sidebar-nav-item"><span className="nav-icon">📁</span>VAKALAR</Link>
            <Link to="/lobby"  className="sidebar-nav-item"><span className="nav-icon">👥</span>LOBİ</Link>
            <Link to="/leaderboard" className="sidebar-nav-item"><span className="nav-icon">🏆</span>RANKING</Link>
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-status">STATION_ONLINE</div>
          </div>
        </div>

        {/* Main */}
        <div className="hero-main">
          <div className="hero-tag">// CLASSIFIED · EYES_ONLY · STATION_42</div>
          <h1 className="hero-title">
            <span className="hero-title-accent">DEDE</span>KTİF
          </h1>
          <p className="hero-subtitle">// INFILTRATION_PROTOCOL_ACTIVE</p>
          <div className="hero-actions">
            {user ? (
              <>
                <Link to="/cases" className="btn-hero-primary">SOLO SORUŞTURMA</Link>
                <Link to="/lobby" className="btn-hero-secondary">TAKIM KUR</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-hero-primary">OPERATÖR OL</Link>
                <Link to="/login"    className="btn-hero-secondary">GİRİŞ YAP</Link>
              </>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="hero-stats-bar">
          {[
            { num: '04', lbl: 'AKTİF VAKA' },
            { num: '∞',  lbl: 'KATMAN'     },
            { num: '7/24', lbl: 'CANLI'    },
            { num: '256', lbl: 'OPERATÖR'  },
          ].map(s => (
            <div key={s.lbl} className="hero-stat-item">
              <span className="stat-num">{s.num}</span>
              <span className="stat-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Character Select ── */}
      <div className="home-chars">
        <div className="chars-header">
          <div>
            <div className="chars-title">CHARACTER SELECT</div>
            <div className="chars-subtitle">/ SELECT_SPECIALIZATION_TO_BEGIN</div>
          </div>
          <div className="chars-count">04 / 04 👤</div>
        </div>
        <div className="chars-grid">
          {CHARS.map(c => (
            <div key={c.name} className="char-card" style={{ '--char-color': c.color }}>
              <div className="char-card-img">{c.icon}</div>
              <div className="char-card-body">
                <div className="char-name">{c.name}</div>
                <div className="char-desc">{c.desc}</div>
                <div className="char-footer">
                  <span className="char-diff">{c.diff}</span>
                  <Link to={user ? '/cases' : '/register'} className="char-select-btn">SEÇT</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom: Feed + Featured ── */}
      <div className="home-bottom">
        <div className="home-feed">
          <div className="feed-header">
            <span className="feed-dot" />
            <span className="feed-title">● LOBBY_INTEL_FEED</span>
            <span className="feed-sync">SYNC: 99.4%</span>
          </div>
          <div className="feed-items">
            {FEED.map((f, i) => (
              <div key={i} className="feed-item">
                <span className="feed-time">[{f.time}]</span>
                <span className="feed-text" style={{ color: f.color }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="home-featured">
          <div className="featured-label">// ACTIVE_CASE_FEED</div>
          <div className="featured-card">
            <div className="featured-card-tag">● AKTİF VAKA</div>
            <div className="featured-card-title">MURDER_AT_0xFI</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
              CEO ofisinde ölü bulundu. Dijital izler sizi bekliyor.
            </div>
            <Link to={user ? '/cases' : '/register'} className="featured-card-btn">
              DOSYAYI AÇ →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

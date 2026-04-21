import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home">
      {/* Hero */}
      <div className="home-hero">
        <div className="hero-bg-grid"/>
        <div className="hero-scanline"/>

        <div className="hero-content">
          <div className="hero-tag">// CLASSIFIED · EYES ONLY</div>
          <h1 className="hero-title">DEDEKTIF</h1>
          <p className="hero-subtitle">
            Dijital boşluk çığlık atıyor. Şifreli katmanların içine gizlenmiş gerçeği ortaya çıkar.
            Soruşturman telin ucundan başlıyor.
          </p>

          <div className="hero-actions">
            {user ? (
              <>
                <Link to="/cases" className="btn btn-primary btn-large">
                  SOLO SORUŞTURMA
                </Link>
                <Link to="/lobby" className="btn btn-secondary btn-large">
                  TAKIM KUR
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-large">
                  OPERATÖR OL
                </Link>
                <Link to="/login" className="btn btn-secondary btn-large">
                  GİRİŞ YAP
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="stat-num">04</span>
            <span className="stat-lbl">AKTİF VAKA</span>
          </div>
          <div className="hero-stat-divider"/>
          <div className="hero-stat">
            <span className="stat-num">∞</span>
            <span className="stat-lbl">KATMAN</span>
          </div>
          <div className="hero-stat-divider"/>
          <div className="hero-stat">
            <span className="stat-num">24/7</span>
            <span className="stat-lbl">CANLI</span>
          </div>
        </div>
      </div>

      {/* Specializations */}
      <div className="home-specs container">
        <div className="section-header">
          <h2>UZMANLIK SEÇ</h2>
          <span className="section-tag">/ SELECT_CLASS</span>
        </div>

        <div className="specs-grid">
          {[
            { icon: '🔍', name: 'OSINT', desc: 'Açık kaynak istihbaratı uzmanı. Sosyal ayak izlerini ve metadata\'yı takip et.', diff: 'ORTA', color: '#00d4ff' },
            { icon: '🌐', name: 'WEB EXPLOIT', desc: 'Çevre güvenliğini delerek geç. SQL injection, XSS ve kırık auth senin araçların.', diff: 'YÜKSEK', color: '#f5c518' },
            { icon: '🔬', name: 'FORENSICS', desc: 'Suç mahallini hafıza dökümlerinden ve parçalanmış disk görüntülerinden yeniden oluştur.', diff: 'AŞIRI', color: '#ff3b3b' },
            { icon: '⚙️', name: 'REV_ENG', desc: 'Binary\'leri parçala ve şifreyi çöz. Kodu yaratıcısından daha iyi anla.', diff: 'İNSANÜSTÜ', color: '#00ff88' },
          ].map(s => (
            <div key={s.name} className="spec-card" style={{ '--accent': s.color }}>
              <div className="spec-icon">{s.icon}</div>
              <div className="spec-name">{s.name}</div>
              <div className="spec-desc">{s.desc}</div>
              <div className="spec-diff">
                <span className="diff-label">ZORLUK:</span>
                <span className="diff-val" style={{ color: s.color }}>{s.diff}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live feed */}
      <div className="home-feed container">
        <div className="feed-header">
          <span className="feed-dot"/>
          <span className="feed-title">CANLI İSTİHBARAT AKIŞI</span>
          <span className="feed-sync">STATION_SYNC: 99%</span>
        </div>
        <div className="feed-items">
          {[
            { time: '04:02:11', text: 'Yeni vaka dosyası yüklendi: 23:17\'den Sonra', color: '#f5c518' },
            { time: '03:44:12', text: 'Sistem: Şifreli bağlantı kuruldu — AES-256-XTS', color: '#00d4ff' },
            { time: '02:18:55', text: 'Uyarı: Yetkisiz tarama tespit edildi — subnet 10.0.x.x', color: '#ff3b3b' },
            { time: '01:33:07', text: 'Operatör soruşturmayı tamamladı: Dijital İz', color: '#00ff88' },
          ].map((f, i) => (
            <div key={i} className="feed-item">
              <span className="feed-time">[{f.time}]</span>
              <span className="feed-text" style={{ color: f.color }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;

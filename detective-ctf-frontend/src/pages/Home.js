import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">🕵️ Dedektif CTF</h1>
        <p className="hero-subtitle">
          İp uçlarını takip edin, sistemleri hackleyin ve katili bulun!
        </p>
        <p className="hero-description">
          Gerçek dedektif gibi düşünün, siber güvenlik becerilerinizi kullanın
          ve karmaşık vakaları çözün. Her vaka yeni bir meydan okuma!
        </p>
        
        <div className="hero-actions">
          {user ? (
            <Link to="/lobby" className="btn btn-primary btn-large">
              Lobiye Git
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-large">
                Hemen Başla
              </Link>
              <Link to="/login" className="btn btn-secondary btn-large">
                Giriş Yap
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="features-section">
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3>İpuçları Sistemi</h3>
          <p>Her vaka birçok ipucu içerir. Sistemleri hackleyerek yeni ipuçları keşfedin.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">💻</div>
          <h3>Hacklenebilir Sistemler</h3>
          <p>SSH, FTP, Email ve daha fazla sistem türünü hackleyin. Gerçek CTF deneyimi!</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🏆</div>
          <h3>Puan ve Liderlik</h3>
          <p>Vakaları çözerek puan kazanın ve liderlik tablosunda yükselın.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Zorluk Seviyeleri</h3>
          <p>Kolay vakalardan başlayın, zorluğu artırarak kendinizi geliştirin.</p>
        </div>
      </div>

      <div className="how-it-works">
        <h2>Nasıl Çalışır?</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Vaka Seçin</h3>
            <p>İlginizi çeken bir vakayı seçin ve hikayeyi okuyun</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>İpuçlarını İnceleyin</h3>
            <p>İlk ipuçlarını okuyun ve sistemleri keşfedin</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Sistemleri Hackleyin</h3>
            <p>Doğru kullanıcı adı ve şifreyi bularak sistemlere girin</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Katili Bulun</h3>
            <p>Tüm kanıtları toplayın ve katili tespit edin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

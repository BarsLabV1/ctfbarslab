import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { casesAPI } from '../services/api';
import './CaseList.css';

const CAT_COLORS = {
  OSINT:      '#f5c518',
  FORENSICS:  '#ff3b3b',
  WEB:        '#00d4ff',
  CRYPTO:     '#ff6b35',
  NETWORK:    '#00ff88',
  HARDWARE:   '#a855f7',
  PENTESTING: '#00d4ff',
  DEFAULT:    '#f5c518',
};

const CAT_ICONS = {
  OSINT: '🔍', FORENSICS: '🔬', WEB: '🌐',
  CRYPTO: '🔐', NETWORK: '📡', HARDWARE: '⚙️',
  PENTESTING: '💻', DEFAULT: '📁',
};

const getCatColor = (title = '') => {
  const t = title.toUpperCase();
  for (const key of Object.keys(CAT_COLORS)) {
    if (t.includes(key)) return CAT_COLORS[key];
  }
  return CAT_COLORS.DEFAULT;
};

const getCatLabel = (title = '') => {
  const t = title.toUpperCase();
  for (const key of Object.keys(CAT_ICONS)) {
    if (t.includes(key)) return key;
  }
  return 'CASE';
};

const getCatIcon = (title = '') => {
  const t = title.toUpperCase();
  for (const key of Object.keys(CAT_ICONS)) {
    if (t.includes(key)) return CAT_ICONS[key];
  }
  return CAT_ICONS.DEFAULT;
};

const getDiffBadge = (d) => d <= 2 ? 'badge-easy' : d <= 3 ? 'badge-medium' : 'badge-hard';
const getDiffText  = (d) => d <= 2 ? 'KOLAY' : d <= 3 ? 'ORTA' : 'ZOR';

const CaseList = () => {
  const [cases,   setCases]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => { fetchCases(); }, []);

  const fetchCases = async () => {
    try {
      const res = await casesAPI.getAll();
      setCases(res.data);
    } catch {
      setError('Vakalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">VAKALAR YÜKLENİYOR...</div>;
  if (error)   return <div className="error-message">{error}</div>;

  return (
    <div className="cases-page">
      <div className="cases-header">
        <div className="cases-header-left">
          <div className="cases-header-tag">CHALLENGE_ASSETS</div>
          <h1>VAKA DOSYALARI</h1>
        </div>
        <div className="cases-header-count">
          {cases.length} VAKA BULUNDU
        </div>
      </div>

      <div className="cases-grid">
        {cases.map((c) => {
          const color = getCatColor(c.title);
          const label = getCatLabel(c.title);
          const icon  = getCatIcon(c.title);
          return (
            <Link to={`/cases/${c.id}`} key={c.id} className="case-card-link">
              <div className="case-card">
                {/* Image */}
                <div className="case-card-img">
                  {c.imageUrl ? (
                    <img
                      src={(process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace('/api', '') + c.imageUrl}
                      alt={c.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                    />
                  ) : (
                    <span className="case-cat-badge" style={{ '--cat-color': color }}>{label}</span>
                  )}
                  {c.imageUrl && <span className="case-cat-badge" style={{ '--cat-color': color }}>{label}</span>}
                  {icon && !c.imageUrl && icon}
                  <div className="case-card-img-overlay">UNLOCKCONTENT_JSON</div>
                </div>

                {/* Body */}
                <div className="case-card-body">
                  <h2>{c.title.toUpperCase().replace(/ /g, '_')}</h2>
                  <div className="case-badges">
                    <span className={`badge ${getDiffBadge(c.difficulty)}`}>{getDiffText(c.difficulty)}</span>
                    {c.isCompleted && <span className="badge badge-completed">✓ TAMAMLANDI</span>}
                  </div>

                  <div className="case-footer">
                    <span className="case-points">⬡ {c.totalPoints} PUAN</span>
                    <span className="case-edit-btn">✏</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {cases.length === 0 && (
        <div className="no-cases">// AKTİF VAKA BULUNAMADI</div>
      )}
    </div>
  );
};

export default CaseList;

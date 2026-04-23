import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { casesAPI } from '../services/api';
import './CaseList.css';

const CaseList = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchCases(); }, []);

  const fetchCases = async () => {
    try {
      const response = await casesAPI.getAll();
      setCases(response.data);
    } catch {
      setError('Vakalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (d) => d <= 2 ? 'badge-easy' : d <= 3 ? 'badge-medium' : 'badge-hard';
  const getDifficultyText  = (d) => d <= 2 ? 'KOLAY' : d <= 3 ? 'ORTA' : 'ZOR';

  if (loading) return <div className="loading">VAKALAR YÜKLENİYOR</div>;
  if (error)   return <div className="error-message">{error}</div>;

  return (
    <div className="container">
      <div className="cases-header">
        <div className="cases-header-top">
          <h1>VAKA DOSYALARI</h1>
          <span className="cases-header-tag">// AKTİF SORUŞTURMALAR</span>
        </div>
        <p>DECRYPTING_ACTIVE_THREADS... {cases.length} vaka bulundu</p>
      </div>

      <div className="cases-grid">
        {cases.map((c) => (
          <Link to={`/cases/${c.id}`} key={c.id} className="case-card-link">
            <div className="case-card">
              <div className="case-card-top">
                <div className="case-card-id">ID: #{String(c.id).padStart(4,'0')} — SINIFLANDIRILMIŞ</div>
                <h2>{c.title}</h2>
                <div className="case-badges">
                  <span className={`badge ${getDifficultyBadge(c.difficulty)}`}>
                    {getDifficultyText(c.difficulty)}
                  </span>
                  {c.isCompleted && <span className="badge badge-completed">✓ TAMAMLANDI</span>}
                </div>
              </div>
              <p className="case-description">{c.description}</p>
              <div className="case-footer">
                <span className="case-points">⬡ {c.totalPoints} INTEL</span>
                <span className="case-challenges">{c.challengeCount} GÖREV</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {cases.length === 0 && (
        <div className="no-cases">// AKTİF VAKA BULUNAMADI</div>
      )}
    </div>
  );
};

export default CaseList;

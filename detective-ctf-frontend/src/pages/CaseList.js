import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { casesAPI } from '../services/api';
import './CaseList.css';

const CaseList = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await casesAPI.getAll();
      setCases(response.data);
    } catch (err) {
      setError('Vakalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    if (difficulty <= 2) return 'badge-easy';
    if (difficulty <= 3) return 'badge-medium';
    return 'badge-hard';
  };

  const getDifficultyText = (difficulty) => {
    if (difficulty <= 2) return 'Kolay';
    if (difficulty <= 3) return 'Orta';
    return 'Zor';
  };

  if (loading) return <div className="loading">Vakalar yükleniyor...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="container">
      <div className="cases-header">
        <h1>🔍 Vakalar</h1>
        <p>Challenge'ları çöz, flag'leri bul ve puan kazan!</p>
      </div>

      <div className="cases-grid">
        {cases.map((caseItem) => (
          <Link to={`/cases/${caseItem.id}`} key={caseItem.id} className="case-card-link">
            <div className="case-card">
              <div className="case-header">
                <h2>{caseItem.title}</h2>
                <div className="case-badges">
                  <span className={`badge ${getDifficultyBadge(caseItem.difficulty)}`}>
                    {getDifficultyText(caseItem.difficulty)}
                  </span>
                  {caseItem.isCompleted && (
                    <span className="badge badge-completed">✓ Çözüldü</span>
                  )}
                </div>
              </div>
              
              <p className="case-description">{caseItem.description}</p>
              
              <div className="case-footer">
                <div className="case-points">
                  ⭐ {caseItem.totalPoints} puan
                </div>
                <div className="case-challenges">
                  🎯 {caseItem.challengeCount} Challenge
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {cases.length === 0 && (
        <div className="no-cases">
          <p>Henüz vaka bulunmuyor.</p>
        </div>
      )}
    </div>
  );
};

export default CaseList;

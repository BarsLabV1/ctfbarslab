import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { casesAPI } from '../services/api';
import CrimeSceneReport from '../components/CrimeSceneReport';
import EvidenceBoard from '../components/EvidenceBoard';
import './CaseDetail.css';

const DIFFICULTY_MAP = {
  1: { label: 'Çok Kolay', color: '#34d399' },
  2: { label: 'Kolay',     color: '#34d399' },
  3: { label: 'Orta',      color: '#fbbf24' },
  4: { label: 'Zor',       color: '#f87171' },
  5: { label: 'Uzman',     color: '#a78bfa' },
};

const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState('report');

  useEffect(() => { fetchCase(); }, [id]); // eslint-disable-line

  const fetchCase = async () => {
    try {
      const response = await casesAPI.getById(id);
      setCaseData(response.data);
    } catch {
      setError('Vaka yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Vaka yükleniyor...</div>;
  if (error)   return <div className="error-message">{error}</div>;
  if (!caseData) return <div className="error-message">Vaka bulunamadı</div>;

  const diff = DIFFICULTY_MAP[caseData.difficulty] || DIFFICULTY_MAP[3];

  return (
    <div className="container">
      <button onClick={() => navigate('/cases')} className="btn btn-secondary back-btn">
        ← Senaryolara Dön
      </button>

      {/* Hero */}
      <div className="case-detail-hero">
        <div className="case-detail-hero-left">
          <div className="case-category-tag">🔍 Senaryo #{caseData.id}</div>
          <h1>{caseData.title}</h1>
          <p className="case-story">{caseData.story || caseData.description}</p>

          <div className="case-meta-row">
            <span className="meta-chip" style={{ borderColor: diff.color, color: diff.color }}>
              ⚡ {diff.label}
            </span>
            <span className="meta-chip">⭐ {caseData.totalPoints} puan</span>
            <span className="meta-chip">🎯 {caseData.challengeCount} Challenge</span>
          </div>
        </div>

        <div className="case-detail-hero-right">
          <div className="start-card">
            <div className="start-card-icon">🕵️</div>
            <h3>Senaryoyu Başlat</h3>
            <p>Solo oyna ya da takım kur</p>
            <button
              className="btn btn-primary btn-large start-btn"
              onClick={() => navigate(`/lobby/${id}`)}
            >
              🚀 Başla
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="case-tabs">
        <button className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>
          📄 Olay Yeri Raporu
        </button>
        <button className={`tab-btn ${activeTab === 'board' ? 'active' : ''}`} onClick={() => setActiveTab('board')}>
          🔍 Dedektif Panosu
        </button>
      </div>

      {activeTab === 'report' && <CrimeSceneReport caseData={caseData} />}
      {activeTab === 'board'  && (
        <EvidenceBoard
          clues={caseData.availableClues || []}
          suspects={[]}
          connections={[]}
        />
      )}
    </div>
  );
};

export default CaseDetail;

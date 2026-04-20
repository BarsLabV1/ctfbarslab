import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Challenges.css';

const Challenges = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [flag, setFlag] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, [caseId]);

  const fetchChallenges = async () => {
    try {
      const response = await api.get(`/challenges/case/${caseId}`);
      setChallenges(response.data);
    } catch (err) {
      setError('Challenge\'lar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeClick = async (challenge) => {
    if (!challenge.isUnlocked) {
      alert('Bu challenge\'ı açmak için önce gerekli challenge\'ı çözmelisiniz!');
      return;
    }

    try {
      const response = await api.get(`/challenges/${challenge.id}`);
      setSelectedChallenge(response.data);
      setFlag('');
      setSubmitMessage('');
    } catch (err) {
      alert('Challenge detayları yüklenirken hata oluştu');
    }
  };

  const handleStartVM = async () => {
    if (!selectedChallenge) return;

    try {
      const response = await api.post(`/challenges/${selectedChallenge.id}/start-vm`);
      alert(`VM başlatıldı!\nIP: ${response.data.ipAddress}\nPort: ${response.data.port}`);
      
      // Challenge'ı yeniden yükle
      const updatedChallenge = await api.get(`/challenges/${selectedChallenge.id}`);
      setSelectedChallenge(updatedChallenge.data);
    } catch (err) {
      alert(err.response?.data?.message || 'VM başlatılamadı');
    }
  };

  const handleSubmitFlag = async (e) => {
    e.preventDefault();
    if (!selectedChallenge) return;

    setSubmitMessage('');
    setSubmitSuccess(false);

    try {
      const response = await api.post(`/challenges/${selectedChallenge.id}/submit`, {
        flag: flag
      });

      setSubmitMessage(response.data.message);
      setSubmitSuccess(response.data.success);

      if (response.data.success) {
        setFlag('');
        // Challenge listesini yenile
        fetchChallenges();
        setTimeout(() => {
          setSelectedChallenge(null);
        }, 2000);
      }
    } catch (err) {
      setSubmitMessage('Flag gönderilemedi');
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'OSINT': '🔍',
      'Web': '🌐',
      'Forensics': '🔬',
      'Crypto': '🔐',
      'Reverse': '⚙️',
      'PWN': '💣',
      'Network': '🌐',
      'Final': '🎯'
    };
    return icons[category] || '📝';
  };

  if (loading) return <div className="loading">Challenge'lar yükleniyor...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="container">
      <button onClick={() => navigate(`/cases/${caseId}`)} className="btn btn-secondary back-btn">
        ← Vakaya Dön
      </button>

      <div className="challenges-header">
        <h1>🎯 Challenge'lar</h1>
        <p>Sırayla challenge'ları çöz ve flag'leri bul!</p>
      </div>

      <div className="challenges-grid">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className={`challenge-card ${!challenge.isUnlocked ? 'locked' : ''} ${challenge.isSolved ? 'solved' : ''}`}
            onClick={() => handleChallengeClick(challenge)}
          >
            <div className="challenge-icon">
              {getCategoryIcon(challenge.category)}
            </div>
            <div className="challenge-order">#{challenge.order}</div>
            <h3>{challenge.title}</h3>
            <div className="challenge-category">{challenge.category}</div>
            <div className="challenge-points">⭐ {challenge.points} puan</div>
            
            {challenge.isSolved && (
              <div className="challenge-solved-badge">✓ Çözüldü</div>
            )}
            
            {!challenge.isUnlocked && (
              <div className="challenge-locked-badge">
                🔒 Kilitli
                {challenge.requiredChallengeTitle && (
                  <div className="required-text">
                    Gerekli: {challenge.requiredChallengeTitle}
                  </div>
                )}
              </div>
            )}
            
            {challenge.attempts > 0 && !challenge.isSolved && (
              <div className="challenge-attempts">
                {challenge.attempts} deneme
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedChallenge && (
        <div className="challenge-modal-overlay" onClick={() => setSelectedChallenge(null)}>
          <div className="challenge-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedChallenge(null)}>✕</button>
            
            <div className="modal-header">
              <h2>{getCategoryIcon(selectedChallenge.category)} {selectedChallenge.title}</h2>
              <div className="modal-meta">
                <span className="modal-category">{selectedChallenge.category}</span>
                <span className="modal-points">⭐ {selectedChallenge.points} puan</span>
              </div>
            </div>

            <div className="modal-content">
              <div className="challenge-description">
                <h3>📋 Açıklama</h3>
                <p>{selectedChallenge.description}</p>
              </div>

              {selectedChallenge.hasVM && (
                <div className="vm-section">
                  <h3>🖥️ Sanal Makine</h3>
                  {selectedChallenge.vmConnectionInfo ? (
                    <div className="vm-info">
                      <p>✅ VM çalışıyor</p>
                      <code>{selectedChallenge.vmConnectionInfo}</code>
                    </div>
                  ) : (
                    <button onClick={handleStartVM} className="btn btn-primary">
                      VM Başlat
                    </button>
                  )}
                </div>
              )}

              {selectedChallenge.evidences && selectedChallenge.evidences.length > 0 && (
                <div className="evidences-section">
                  <h3>📁 Deliller</h3>
                  {selectedChallenge.evidences.map((evidence) => (
                    <div key={evidence.id} className="evidence-item">
                      <span className="evidence-type">{evidence.type}</span>
                      <span className="evidence-title">{evidence.title}</span>
                      <a href={evidence.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                        İndir
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {!selectedChallenge.isSolved && (
                <div className="flag-submit-section">
                  <h3>🚩 Flag Gönder</h3>
                  <form onSubmit={handleSubmitFlag}>
                    <input
                      type="text"
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                      placeholder="CTF{...}"
                      required
                    />
                    <button type="submit" className="btn btn-primary">
                      Gönder
                    </button>
                  </form>
                  
                  {submitMessage && (
                    <div className={submitSuccess ? 'success-message' : 'error-message'}>
                      {submitMessage}
                    </div>
                  )}
                  
                  {selectedChallenge.attempts > 0 && (
                    <div className="attempts-info">
                      Deneme sayısı: {selectedChallenge.attempts}
                    </div>
                  )}
                </div>
              )}

              {selectedChallenge.isSolved && (
                <div className="success-message">
                  ✅ Bu challenge'ı çözdünüz!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challenges;

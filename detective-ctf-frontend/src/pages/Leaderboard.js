import React, { useState, useEffect } from 'react';
import { leaderboardAPI } from '../services/api';
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await leaderboardAPI.get();
      setLeaderboard(response.data);
    } catch (err) {
      setError('Liderlik tablosu yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) return <div className="loading">Liderlik tablosu yükleniyor...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="container">
      <div className="leaderboard-header">
        <h1>🏆 Liderlik Tablosu</h1>
        <p>En başarılı dedektifleri keşfedin</p>
      </div>

      <div className="leaderboard-table">
        <div className="table-header">
          <div className="col-rank">Sıra</div>
          <div className="col-username">Kullanıcı</div>
          <div className="col-cases">Çözülen Challenge'lar</div>
          <div className="col-score">Toplam Puan</div>
        </div>

        {leaderboard.map((user, index) => (
          <div key={index} className={`table-row ${index < 3 ? 'top-three' : ''}`}>
            <div className="col-rank rank-badge">
              {getMedalEmoji(index + 1)}
            </div>
            <div className="col-username">
              <span className="username-text">{user.username}</span>
            </div>
            <div className="col-cases">
              {user.solvedChallenges} challenge
            </div>
            <div className="col-score score-value">
              ⭐ {user.totalScore}
            </div>
          </div>
        ))}

        {leaderboard.length === 0 && (
          <div className="no-data">
            Henüz liderlik tablosunda kimse yok. İlk dedektif siz olun!
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

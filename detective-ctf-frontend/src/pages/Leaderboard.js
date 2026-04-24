import { useState, useEffect } from 'react';
import { leaderboardAPI } from '../services/api';
import './Leaderboard.css';

const getClearance = (score) => {
  if (score >= 10000) return { label: 'CRITICAL', cls: 'clearance-critical' };
  if (score >= 5000)  return { label: 'HIGH',     cls: 'clearance-high'     };
  return                     { label: 'MEDIUM',   cls: 'clearance-medium'   };
};

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [tab,         setTab]         = useState('individuals');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => { fetchLeaderboard(); }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await leaderboardAPI.get();
      setLeaderboard(res.data);
    } catch {
      setError('Liderlik tablosu yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">LIDERLIK TABLOSU YÜKLENİYOR...</div>;
  if (error)   return <div className="error-message">{error}</div>;

  return (
    <div className="leaderboard-page">
      <div className="lb-header">
        <div>
          <div className="lb-title">MOST WANTED OPERATIVES</div>
          <div className="lb-subtitle">// INTEL_ARCHIVE · STATION_42</div>
        </div>
        <div className="lb-tabs">
          <button
            className={`lb-tab ${tab === 'individuals' ? 'active' : ''}`}
            onClick={() => setTab('individuals')}
          >INDIVIDUALS</button>
          <button
            className={`lb-tab ${tab === 'teams' ? 'active' : ''}`}
            onClick={() => setTab('teams')}
          >TEAMS</button>
        </div>
      </div>

      <div className="lb-table">
        <div className="lb-table-head">
          <span>RANK</span>
          <span></span>
          <span>OPERATIVE_ID</span>
          <span>CLEARANCE</span>
          <span>INTEL_POINTS</span>
          <span>STATUS</span>
        </div>

        {leaderboard.length === 0 && (
          <div className="no-data">// HENÜZ OPERATÖR YOK — İLK SEN OL</div>
        )}

        {leaderboard.map((u, i) => {
          const clearance = getClearance(u.totalScore);
          const rankNum   = String(i + 1).padStart(2, '0');
          const rankCls   = i === 0 ? 'lb-rank-1' : i === 1 ? 'lb-rank-2' : i === 2 ? 'lb-rank-3' : '';
          return (
            <div key={i} className={`lb-row ${i < 3 ? 'lb-row-top' : ''}`}>
              <div className={`lb-rank ${rankCls}`}>{rankNum}</div>
              <div>
                <div className="lb-avatar">
                  {u.username ? u.username.charAt(0).toUpperCase() : '?'}
                </div>
              </div>
              <div className="lb-name-col">
                <span className="lb-username">
                  {u.username ? u.username.toUpperCase().replace(/ /g, '_') : 'UNKNOWN'}
                </span>
              </div>
              <div className="lb-clearance">
                <span className={`clearance-badge ${clearance.cls}`}>{clearance.label}</span>
              </div>
              <div className="lb-points">
                {u.totalScore?.toLocaleString() ?? '0'}
              </div>
              <div className="lb-status">ACTI</div>
            </div>
          );
        })}

        <div className="lb-footer">VIEW FULL ARCHIVE 09-B →</div>
      </div>
    </div>
  );
};

export default Leaderboard;

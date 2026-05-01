import { useState, useEffect } from 'react';
import api, { leaderboardAPI } from '../services/api';
import './Leaderboard.css';

const getClearance = (score) => {
  if (score >= 10000) return { label: 'KRİTİK',  cls: 'clearance-critical' };
  if (score >= 5000)  return { label: 'YÜKSEK',  cls: 'clearance-high'     };
  if (score >= 1000)  return { label: 'ORTA',    cls: 'clearance-high'     };
  return                     { label: 'DÜŞÜK',   cls: 'clearance-medium'   };
};

const Leaderboard = () => {
  const [users,   setUsers]   = useState([]);
  const [teams,   setTeams]   = useState([]);
  const [tab,     setTab]     = useState('bireysel');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [uRes, tRes] = await Promise.all([
          leaderboardAPI.get(),
          api.get('/leaderboard/teams'),
        ]);
        setUsers(uRes.data);
        setTeams(tRes.data);
      } catch {
        setError('Sıralama yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="loading">SIRALAMA YÜKLENİYOR...</div>;
  if (error)   return <div className="error-message">{error}</div>;

  const list = tab === 'bireysel' ? users : teams;

  return (
    <div className="leaderboard-page">
      <div className="lb-header">
        <div>
          <div className="lb-title">EN İYİ OPERATİFLER</div>
          <div className="lb-subtitle">// SIRALAMA · İSTASYON_42</div>
        </div>
        <div className="lb-tabs">
          <button className={`lb-tab ${tab === 'bireysel' ? 'active' : ''}`} onClick={() => setTab('bireysel')}>
            BİREYSEL
          </button>
          <button className={`lb-tab ${tab === 'takim' ? 'active' : ''}`} onClick={() => setTab('takim')}>
            TAKIM
          </button>
        </div>
      </div>

      <div className="lb-table">
        <div className="lb-table-head">
          <span>SIRA</span>
          <span></span>
          <span>{tab === 'bireysel' ? 'OPERATİF' : 'TAKIM'}</span>
          <span>YETKİ</span>
          <span>PUAN</span>
          <span>DURUM</span>
        </div>

        {list.length === 0 && (
          <div className="no-data">// HENÜZ KİMSE YOK — İLK SEN OL</div>
        )}

        {list.map((item, i) => {
          const score     = item.totalScore ?? 0;
          const clearance = getClearance(score);
          const rankNum   = String(i + 1).padStart(2, '0');
          const rankCls   = i === 0 ? 'lb-rank-1' : i === 1 ? 'lb-rank-2' : i === 2 ? 'lb-rank-3' : '';
          const name      = tab === 'bireysel'
            ? (item.username || 'BİLİNMEYEN')
            : (item.name || 'BİLİNMEYEN');

          return (
            <div key={i} className={`lb-row ${i < 3 ? 'lb-row-top' : ''}`}>
              <div className={`lb-rank ${rankCls}`}>{rankNum}</div>
              <div>
                <div className="lb-avatar">
                  {name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="lb-name-col">
                <span className="lb-username">
                  {name.toUpperCase().replace(/ /g, '_')}
                </span>
                {tab === 'takim' && (
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', marginLeft:8 }}>
                    {item.memberCount} üye
                  </span>
                )}
              </div>
              <div className="lb-clearance">
                <span className={`clearance-badge ${clearance.cls}`}>{clearance.label}</span>
              </div>
              <div className="lb-points">{score.toLocaleString('tr-TR')}</div>
              <div className="lb-status">AKTİF</div>
            </div>
          );
        })}

        <div className="lb-footer">TÜM ARŞİVİ GÖRÜNTÜLE →</div>
      </div>
    </div>
  );
};

export default Leaderboard;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { casesAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import CrimeSceneReport from '../components/CrimeSceneReport';
import EvidenceBoard from '../components/EvidenceBoard';
import './Play.css';

const CATEGORY_ICONS = {
  OSINT: '🔍', Web: '🌐', Forensics: '🔬', Crypto: '🔐',
  Reverse: '⚙️', PWN: '💣', Network: '📡', Final: '🎯',
};

/* ── Hint button ── */
const HintButton = ({ hints, usedHints, challengeId, onHintUsed }) => {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState({});

  // Pre-reveal already used hints
  useEffect(() => {
    if (!usedHints || !hints) return;
    try {
      const used = JSON.parse(usedHints);
      const updates = {};
      used.forEach(idx => {
        if (hints[idx]) updates[idx] = hints[idx].text || hints[idx].Text;
      });
      if (Object.keys(updates).length) setRevealed(prev => ({ ...prev, ...updates }));
    } catch {}
  }, [usedHints, hints]);

  const handleReveal = async (idx) => {
    if (revealed[idx]) return;
    try {
      const res = await api.post(`/challenges/${challengeId}/use-hint`, { hintIndex: idx });
      setRevealed(prev => ({ ...prev, [idx]: res.data.text }));
      if (!res.data.alreadyUsed) {
        showToast(`İpucu kullanıldı! -${res.data.penalty} puan (-%${res.data.penaltyPercent})`, 'warning');
        onHintUsed && onHintUsed();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'İpucu alınamadı', 'error');
    }
  };

  if (!hints || hints.length === 0) return null;

  return (
    <div className="hint-container">
      <button className="hint-toggle-btn" onClick={() => setOpen(o => !o)}>
        💡 İpuçları ({hints.length})
      </button>

      {open && (
        <div className="hints-panel">
          {hints.map((h, idx) => {
            const penalty = h.penaltyPercent || h.PenaltyPercent;
            const isRevealed = !!revealed[idx];
            return (
              <div key={idx} className={`hint-item ${isRevealed ? 'revealed' : ''}`}>
                <div className="hint-header">
                  <span className="hint-num">İpucu {idx + 1}</span>
                  <span className="hint-penalty">-%{penalty} puan</span>
                </div>
                {isRevealed ? (
                  <p className="hint-text">{revealed[idx]}</p>
                ) : (
                  <button className="hint-reveal-btn" onClick={() => handleReveal(idx)}>
                    💡 Göster (-%{penalty} puan)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── Single question card ── */
const QuestionCard = ({ challenge, index, onSolved }) => {
  const { showToast } = useToast();
  const [expanded, setExpanded]   = useState(false);
  const [detail, setDetail]       = useState(null);
  const [flag, setFlag]           = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (detail) { setExpanded(e => !e); return; }
    try {
      const res = await api.get(`/challenges/${challenge.id}`);
      setDetail(res.data);
      setExpanded(true);
    } catch {
      showToast('Soru yüklenemedi', 'error');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!flag.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/challenges/${challenge.id}/submit`, { flag });
      if (res.data.success) {
        showToast(`✅ Doğru! +${res.data.points} puan`, 'success');
        setFlag('');
        onSolved();
      } else {
        showToast(res.data.message, 'error');
      }
    } catch {
      showToast('Gönderilemedi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const hints = (() => {
    try {
            const raw = detail?.hints || detail?.Hints;
            return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  })();

  const isLocked  = !challenge.isUnlocked;
  const isSolved  = challenge.isSolved;
  const icon      = CATEGORY_ICONS[challenge.category] || '📝';

  return (
    <div className={`question-card ${isLocked ? 'locked' : ''} ${isSolved ? 'solved' : ''} ${expanded ? 'expanded' : ''}`}>
      {/* Header — always visible */}
      <div className="question-header" onClick={isLocked ? undefined : load}>
        <div className="question-left">
          <span className="question-num">#{index + 1}</span>
          <span className="question-icon">{isLocked ? '🔒' : icon}</span>
          <div className="question-info">
            <span className="question-title">{challenge.title}</span>
            <span className="question-cat">{challenge.category}</span>
          </div>
        </div>
        <div className="question-right">
          <span className="question-pts">⭐ {challenge.points}</span>
          {isSolved && <span className="solved-badge">✓ Çözüldü</span>}
          {isLocked && (
            <span className="locked-badge">
              🔒 {challenge.requiredChallengeTitle ? `"${challenge.requiredChallengeTitle}" çözülmeli` : 'Kilitli'}
            </span>
          )}
          {!isLocked && !isSolved && (
            <span className="expand-arrow">{expanded ? '▲' : '▼'}</span>
          )}
        </div>
      </div>

      {/* Body — expanded */}
      {expanded && detail && (
        <div className="question-body">
          <p className="question-desc">{detail.description || detail.Description}</p>

          {/* Files */}
          {(detail.files || detail.Files) && (() => {
            try {
              const files = JSON.parse(detail.files || detail.Files);
              return files.length > 0 ? (
                <div className="question-files">
                  <h4>📁 Dosyalar</h4>
                  {files.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="file-link">
                      {f.type === 'video' ? '🎥' : '📄'} {f.name}
                    </a>
                  ))}
                </div>
              ) : null;
            } catch { return null; }
          })()}

          {/* VM */}
          {detail.hasVM && (
            <div className="question-vm">
              <h4>🖥️ Sanal Makine</h4>
              {detail.vmConnectionInfo ? (
                <code className="vm-info">{detail.vmConnectionInfo}</code>
              ) : (
                <button className="btn btn-secondary btn-small">VM Başlat</button>
              )}
            </div>
          )}

          {/* Hints */}
          <HintButton
            hints={hints}
            usedHints={detail.usedHints || detail.UsedHints}
            challengeId={challenge.id}
            onHintUsed={onSolved}
          />

          {/* Flag submit */}
          {!isSolved ? (
            <form className="flag-form" onSubmit={submit}>
              <input
                type="text"
                placeholder="CTF{...}"
                value={flag}
                onChange={e => setFlag(e.target.value)}
                className="flag-input"
              />
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? '...' : '🚩 Gönder'}
              </button>
            </form>
          ) : (
            <div className="solved-msg">✅ Bu soruyu çözdünüz!</div>
          )}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════
   Main Play page
══════════════════════════════════════════ */
const Play = () => {
  const { caseId }    = useParams();
  const navigate      = useNavigate();
  const [tab, setTab] = useState('scenario'); // scenario | questions
  const [caseData, setCaseData]       = useState(null);
  const [challenges, setChallenges]   = useState([]);
  const [loading, setLoading]         = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [caseRes, chalRes] = await Promise.all([
        casesAPI.getById(caseId),
        api.get(`/challenges/case/${caseId}`),
      ]);
      setCaseData(caseRes.data);
      setChallenges(chalRes.data);
    } catch {
      // handled below
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (!caseData) return <div className="error-message">Senaryo bulunamadı</div>;

  const solved  = challenges.filter(c => c.isSolved).length;
  const total   = challenges.length;

  return (
    <div className="play-page">
      {/* Top bar */}
      <div className="play-topbar">
        <button onClick={() => navigate(`/cases/${caseId}`)} className="btn btn-secondary btn-small">
          ← Geri
        </button>
        <div className="play-title">{caseData.title}</div>
        <div className="play-progress">
          <span>{solved}/{total} çözüldü</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: total ? `${(solved/total)*100}%` : '0%' }} />
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="play-tabs">
        <button className={`play-tab ${tab === 'scenario' ? 'active' : ''}`} onClick={() => setTab('scenario')}>
          🕵️ Senaryo
        </button>
        <button className={`play-tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>
          📄 Olay Yeri Raporu
        </button>
        <button className={`play-tab ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>
          🔍 Dedektif Panosu
        </button>
        <button className={`play-tab ${tab === 'questions' ? 'active' : ''}`} onClick={() => setTab('questions')}>
          🎯 Sorular
          {total > 0 && <span className="tab-badge">{solved}/{total}</span>}
        </button>
      </div>

      {/* Content */}
      <div className="play-content container">

        {tab === 'scenario' && (
          <div className="scenario-tab">
            <div className="scenario-story-card">
              <h2>📖 Senaryo</h2>
              <p>{caseData.story || caseData.description}</p>
            </div>
            <div className="scenario-meta">
              <div className="meta-stat">
                <span className="stat-label">Zorluk</span>
                <span className="stat-val">{'⭐'.repeat(caseData.difficulty)}</span>
              </div>
              <div className="meta-stat">
                <span className="stat-label">Toplam Puan</span>
                <span className="stat-val">⭐ {caseData.totalPoints}</span>
              </div>
              <div className="meta-stat">
                <span className="stat-label">Sorular</span>
                <span className="stat-val">🎯 {total}</span>
              </div>
              <div className="meta-stat">
                <span className="stat-label">İlerleme</span>
                <span className="stat-val">{solved}/{total}</span>
              </div>
            </div>
            <button className="btn btn-primary btn-large" onClick={() => setTab('questions')}>
              🎯 Sorulara Geç →
            </button>
          </div>
        )}

        {tab === 'report' && <CrimeSceneReport caseData={caseData} />}

        {tab === 'board' && (
          <EvidenceBoard caseId={parseInt(caseId)} clues={caseData.availableClues || []} />
        )}

        {tab === 'questions' && (
          <div className="questions-tab">
            <div className="questions-header">
              <h2>🎯 Sorular</h2>
              <p>Sırayla çöz — bir soruyu çözmeden sonraki açılmaz</p>
            </div>
            <div className="questions-list">
              {challenges.map((ch, i) => (
                <QuestionCard
                  key={ch.id}
                  challenge={ch}
                  index={i}
                  onSolved={fetchAll}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Play;

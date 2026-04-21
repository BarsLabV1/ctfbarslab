import React, { useState, useEffect, useCallback, useRef } from 'react';
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

/* ── Evidence Thumbnail + Popup ── */
const EvidenceThumb = ({ evidence: ev, url }) => {
  const [open, setOpen] = useState(false);
  const TYPE_ICONS = { video:'🎥', audio:'🎵', image:'🖼️', document:'📄', log:'📋' };
  const icon = TYPE_ICONS[ev.type] || '📁';

  return (
    <>
      <div className="ev-thumb" onClick={() => setOpen(true)}>
        {ev.type === 'image' ? (
          <img src={url} alt={ev.title} className="ev-thumb-img" />
        ) : (
          <div className="ev-thumb-icon">{icon}</div>
        )}
        <div className="ev-thumb-label">{ev.title}</div>
      </div>

      {open && (
        <div className="ev-modal-overlay" onClick={() => setOpen(false)}>
          <div className="ev-modal" onClick={e => e.stopPropagation()}>
            <div className="ev-modal-header">
              <span>{icon} {ev.title}</span>
              <button className="ev-modal-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="ev-modal-body">
              {ev.type === 'video' && (
                <video src={url} controls autoPlay className="ev-modal-video" />
              )}
              {ev.type === 'audio' && (
                <audio src={url} controls autoPlay className="ev-modal-audio" />
              )}
              {ev.type === 'image' && (
                <img src={url} alt={ev.title} className="ev-modal-image" />
              )}
              {!['video','audio','image'].includes(ev.type) && (
                <div className="ev-modal-doc">
                  <p>{ev.description || 'Dosyayı indirmek için tıklayın'}</p>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    📥 İndir / Aç
                  </a>
                </div>
              )}
              {ev.description && ev.type !== 'document' && (
                <p className="ev-modal-desc">{ev.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ── VM Sidebar Card ── */
const VMSidebarCard = ({ caseId, challenges = [], onRefresh }) => {
  const { showToast } = useToast();
  const [vmData, setVmData]             = useState(null);
  const [starting, setStarting]         = useState(false);
  const [stopping, setStopping]         = useState(false);
  const [kaliPort, setKaliPort]         = useState(null);
  const [startingKali, setStartingKali] = useState(false);

  // VM olan soru varsa onu kullan, yoksa ilk soruyu kullan
  const vmChallenge = challenges.find(c => c.hasVM) || challenges[0];

  const startVM = async () => {
    if (!vmChallenge) return;
    setStarting(true);
    try {
      const res = await api.post(`/challenges/${vmChallenge.id}/start-vm`);
      setVmData(res.data);
      showToast(`VM başlatıldı! IP: ${res.data.ipAddress}`, 'success');
      onRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'VM başlatılamadı', 'error');
    } finally { setStarting(false); }
  };

  const stopVM = async () => {
    if (!vmChallenge) return;
    setStopping(true);
    try {
      await api.post(`/challenges/${vmChallenge.id}/stop-vm`);
      setVmData(null);
      setKaliPort(null);
      showToast('VM durduruldu', 'info');
      onRefresh();
    } catch { showToast('VM durdurulamadı', 'error'); }
    finally { setStopping(false); }
  };

  if (!vmChallenge) {
    return <p className="vm-sidebar-empty">Senaryo yükleniyor...</p>;
  }

  return (
    <div className="vm-sidebar-card">
      {!vmData ? (
        <button className="vm-start-btn" onClick={startVM} disabled={starting}>
          {starting ? '⏳ Başlatılıyor...' : '🚀 Makineyi Başlat'}
        </button>
      ) : (
        <div className="vm-active">
          <div style={{display:'flex', alignItems:'center', gap:6}}>
            <div className="vm-active-dot" />
            <span className="vm-active-label">Çalışıyor</span>
          </div>
          <div className="vm-conn-info">
            <div className="vm-conn-row">
              <span>Hedef IP</span>
              <code>{vmData.ipAddress}</code>
            </div>
          </div>
          <div className="vm-btn-row">
            {vmData.terminalPort && (
              <a href={`http://localhost:${vmData.terminalPort}`} target="_blank"
                rel="noopener noreferrer" className="vm-terminal-btn">
                🖥️ Terminal
              </a>
            )}
            <button className="vm-kali-btn" disabled={startingKali}
              onClick={async () => {
                setStartingKali(true);
                try {
                  const res = await api.post(`/challenges/${vmChallenge.id}/start-kali`);
                  setKaliPort(res.data.kaliPort);
                  showToast('Kali masaüstü başlatıldı!', 'success');
                } catch (err) {
                  showToast(err.response?.data?.message || 'Kali başlatılamadı', 'error');
                } finally { setStartingKali(false); }
              }}>
              {startingKali ? '⏳...' : '🐉 Kali'}
            </button>
            <button className="vm-stop-btn" onClick={stopVM} disabled={stopping}>
              {stopping ? '...' : '⏹'}
            </button>
          </div>
          {kaliPort && (
            <a href={`http://localhost:${kaliPort}/`} target="_blank"
              rel="noopener noreferrer" className="vm-kali-open-btn">
              🖥️ Kali Masaüstünü Aç
            </a>
          )}
          {vmData.expiresAt && (
            <div className="vm-expires">
              ⏱ {new Date(vmData.expiresAt).toLocaleTimeString('tr-TR')}'de kapanır
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Start VM Button ── */
const StartVMButton = ({ challengeId, onStarted }) => {
  const { showToast } = useToast();
  const [starting, setStarting] = useState(false);

  const start = async () => {
    setStarting(true);
    try {
      await api.post(`/challenges/${challengeId}/start-vm`);
      showToast('Sanal makine başlatıldı!', 'success');
      onStarted();
    } catch (err) {
      showToast(err.response?.data?.message || 'VM başlatılamadı', 'error');
    } finally {
      setStarting(false);
    }
  };

  return (
    <button className="btn btn-primary btn-small" onClick={start} disabled={starting}>
      {starting ? '⏳ Başlatılıyor...' : '🚀 Makineyi Başlat'}
    </button>
  );
};

/* ── Single question card ── */
const QuestionCard = ({ challenge, index, onSolved, onUnlock }) => {
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
        // unlockContent varsa panoya/rapora ekle
        if (res.data.unlockContent) {
          try {
            const content = JSON.parse(res.data.unlockContent);
            onUnlock && onUnlock(content, challenge.title);
          } catch {}
        }
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

          {/* Dosyalar */}
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

          {/* Deliller (admin panelden yüklenen) */}
          {detail.evidences && detail.evidences.length > 0 && (
            <div className="question-files">
              <h4>🔬 Deliller</h4>
              <div className="evidence-grid">
                {detail.evidences.map((ev) => {
                  const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace('/api', '');
                  const url = ev.fileUrl?.startsWith('http') ? ev.fileUrl : baseUrl + ev.fileUrl;
                  return (
                    <EvidenceThumb key={ev.id} evidence={ev} url={url} />
                  );
                })}
              </div>
            </div>
          )}

          {/* VM */}
          {detail.hasVM && (
            <div className="question-vm">
              <h4>🖥️ Sanal Makine</h4>
              {detail.vmConnectionInfo ? (
                <div className="vm-running">
                  <div className="vm-info-row">
                    <span className="vm-label">IP Adresi:</span>
                    <code className="vm-value">{JSON.parse(detail.vmConnectionInfo || '{}').ip || detail.vmConnectionInfo}</code>
                  </div>
                  <div className="vm-info-row">
                    <span className="vm-label">Port:</span>
                    <code className="vm-value">{JSON.parse(detail.vmConnectionInfo || '{}').port || '22'}</code>
                  </div>
                  <div className="vm-actions">
                    <a
                      href={`http://${JSON.parse(detail.vmConnectionInfo || '{}').terminalUrl || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-small"
                    >
                      🖥️ Web Terminal Aç
                    </a>
                  </div>
                  <div className="vm-hint">
                    SSH: <code>ssh ctfuser@{JSON.parse(detail.vmConnectionInfo || '{}').ip} -p {JSON.parse(detail.vmConnectionInfo || '{}').port}</code>
                  </div>
                </div>
              ) : (
                <StartVMButton challengeId={challenge.id} onStarted={() => {
                  api.get(`/challenges/${challenge.id}`).then(r => setDetail(r.data));
                }} />
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
  const [tab, setTab] = useState('scenario');
  const [caseData, setCaseData]             = useState(null);
  const [challenges, setChallenges]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [unlockedSections, setUnlockedSections] = useState([]); // rapor bölümleri
  const [boardAutoItems, setBoardAutoItems]     = useState([]); // panoya otomatik eklenenler
  const [unlockToasts, setUnlockToasts]         = useState([]); // kenar bildirimleri
  const processedAutoIds = useRef(new Set());   // Play seviyesinde tut — mount/unmount'tan etkilenmesin

  const showUnlockToast = useCallback((data) => {
    const id = Date.now() + Math.random();
    setUnlockToasts(prev => [...prev, { id, ...data }]);
    setTimeout(() => setUnlockToasts(prev => prev.filter(t => t.id !== id)), 7000);
  }, []);

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

  const handleUnlock = useCallback((content, challengeTitle) => {
    if (content.reportSection) {
      setUnlockedSections(prev => [...prev, {
        ...content.reportSection,
        solvedAt: new Date().toLocaleString('tr-TR'),
        challengeTitle,
      }]);
      showUnlockToast({
        icon: '📄',
        title: 'Yeni Belge Açıldı!',
        desc: content.reportSection.title,
        action: () => setTab('report'),
        actionLabel: 'Görüntüle',
        color: '#34d399',
      });
    }
    if (content.boardNote) {
      setBoardAutoItems(prev => {
        const id = `auto_note_${Date.now()}`;
        return [...prev, { type:'note', ...content.boardNote, id }];
      });
      showUnlockToast({
        icon: '🔍',
        title: 'Panoya Not Eklendi!',
        desc: content.boardNote.title,
        action: () => setTab('board'),
        actionLabel: 'Panoya Git',
        color: '#60a5fa',
      });
    }
    if (content.boardSuspect) {
      setBoardAutoItems(prev => {
        const id = `auto_suspect_${Date.now()}`;
        return [...prev, { type:'suspect', ...content.boardSuspect, id }];
      });
      showUnlockToast({
        icon: '🚨',
        title: 'Yeni Şüpheli!',
        desc: content.boardSuspect.name,
        action: () => setTab('board'),
        actionLabel: 'Panoya Git',
        color: '#f87171',
      });
    }
  }, []); // eslint-disable-line

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

        {tab === 'report' && <CrimeSceneReport caseData={caseData} unlockedSections={unlockedSections} />}

        {tab === 'board' && (
          <EvidenceBoard caseId={parseInt(caseId)} clues={caseData.availableClues || []} autoItems={boardAutoItems} onUnlock={handleUnlock} processedIds={processedAutoIds} />
        )}

        {tab === 'questions' && (
          <div className="questions-tab">
            <div className="questions-layout">
              {/* Sol: Sorular */}
              <div className="questions-main">
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
                      onUnlock={handleUnlock}
                    />
                  ))}
                </div>
              </div>

              {/* Sağ: VM paneli — her zaman görünür */}
              <div className="vm-sidebar">
                <div className="vm-sidebar-header">🖥️ Sanal Makine</div>
                <VMSidebarCard caseId={parseInt(caseId)} onRefresh={fetchAll} challenges={challenges} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Unlock bildirimleri — sağ alt köşe ── */}
      <div className="unlock-toast-stack">
        {unlockToasts.map(t => (
          <div key={t.id} className="unlock-toast" style={{ borderLeftColor: t.color }}>
            <span className="unlock-toast-icon">{t.icon}</span>
            <div className="unlock-toast-body">
              <div className="unlock-toast-title">{t.title}</div>
              <div className="unlock-toast-desc">{t.desc}</div>
            </div>
            <button
              className="unlock-toast-action"
              style={{ color: t.color, borderColor: t.color }}
              onClick={() => { t.action(); setUnlockToasts(prev => prev.filter(x => x.id !== t.id)); }}
            >
              {t.actionLabel} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Play;

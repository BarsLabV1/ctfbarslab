import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import api, { casesAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import DetectiveBoard from '../components/DetectiveBoard';
import EvidenceBoard from '../components/EvidenceBoard';
import './Play.css';

/* ── Bağımsız Kali Paneli ── */
const KaliPanel = () => {
  const { showToast } = useToast();
  const [kaliData,      setKaliData]      = useState(null);
  const [starting,      setStarting]      = useState(false);
  const [stopping,      setStopping]      = useState(false);
  const [open,          setOpen]          = useState(false);

  const startKali = async () => {
    setStarting(true);
    try {
      const res = await api.post('/challenges/start-kali-standalone');
      setKaliData(res.data);
      showToast('Kali masaüstü başlatıldı!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Kali başlatılamadı', 'error');
    } finally { setStarting(false); }
  };

  const stopKali = async () => {
    setStopping(true);
    try {
      await api.post('/challenges/stop-kali-standalone');
      setKaliData(null);
      showToast('Kali durduruldu', 'info');
    } catch { showToast('Durdurulamadı', 'error'); }
    finally { setStopping(false); }
  };

  return (
    <div className="kali-panel">
      <button className="kali-toggle-btn" onClick={() => setOpen(o => !o)}>
        🐉 KALİ MASAÜSTÜ {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="kali-panel-body">
          {!kaliData ? (
            <>
              <p className="kali-desc">Tarayıcı üzerinden tam Kali Linux masaüstüne eriş.</p>
              <button className="kali-start-btn" onClick={startKali} disabled={starting}>
                {starting ? '⏳ Başlatılıyor... (~30sn)' : '🚀 Kali Başlat'}
              </button>
            </>
          ) : (
            <div className="kali-active">
              <div className="kali-active-row">
                <span className="kali-dot" />
                <span className="kali-active-label">KALİ ÇALIŞIYOR</span>
              </div>
              <a
                href={`https://${kaliData.ipAddress}:${kaliData.kaliPort}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="kali-open-btn"
              >
                🖥️ Kali Masaüstünü Aç
              </a>
              <div className="kali-info">
                Port: <code>{kaliData.kaliPort}</code>
              </div>
              <button className="kali-stop-btn" onClick={stopKali} disabled={stopping}>
                {stopping ? '...' : '⏹ Durdur'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const HUB_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api')
  .replace('/api', '/hubs/board');

const CATEGORY_ICONS = {
  OSINT: '🔍', Web: '🌐', Forensics: '🔬', Crypto: '🔐',
  Reverse: '⚙️', PWN: '💣', Network: '📡', Final: '🎯', SSH: '🖥️',
};

/* ── İpucu butonu ── */
const HintButton = ({ hints, challengeId, onHintUsed }) => {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState({});

  const handleReveal = async (idx) => {
    if (revealed[idx]) return;
    try {
      const res = await api.post(`/challenges/${challengeId}/use-hint`, { hintIndex: idx });
      setRevealed(prev => ({ ...prev, [idx]: res.data.text }));
      if (!res.data.alreadyUsed) {
        showToast(`İpucu kullanıldı! -%${res.data.penaltyPercent} puan`, 'warning');
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
            return (
              <div key={idx} className={`hint-item ${revealed[idx] ? 'revealed' : ''}`}>
                <div className="hint-header">
                  <span className="hint-num">İpucu {idx + 1}</span>
                  <span className="hint-penalty">-%{penalty} puan</span>
                </div>
                {revealed[idx] ? (
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

/* ── Delil thumbnail ── */
const EvidenceThumb = ({ evidence: ev, url }) => {
  const [open, setOpen] = useState(false);
  const TYPE_ICONS = { video: '🎥', audio: '🎵', image: '🖼️', document: '📄', log: '📋' };
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
              {ev.type === 'video'  && <video src={url} controls autoPlay className="ev-modal-video" />}
              {ev.type === 'audio'  && <audio src={url} controls autoPlay className="ev-modal-audio" />}
              {ev.type === 'image'  && <img src={url} alt={ev.title} className="ev-modal-image" />}
              {!['video','audio','image'].includes(ev.type) && (
                <div className="ev-modal-doc">
                  <p>{ev.description || 'Dosyayı indirmek için tıklayın'}</p>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">📥 İndir / Aç</a>
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

/* ── VM Butonu ── */
const VMButton = ({ challenge, onStarted }) => {
  const { showToast } = useToast();
  const [vmData, setVmData] = useState(null);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyIP = () => {
    navigator.clipboard?.writeText(vmData.ipAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startVM = async () => {
    setStarting(true);
    try {
      const res = await api.post(`/challenges/${challenge.id}/start-vm`);
      setVmData(res.data);
      showToast('VM başlatıldı!', 'success');
      onStarted && onStarted();
    } catch (err) {
      showToast(err.response?.data?.message || 'VM başlatılamadı', 'error');
    } finally { setStarting(false); }
  };

  const stopVM = async () => {
    setStopping(true);
    try {
      await api.post(`/challenges/${challenge.id}/stop-vm`);
      setVmData(null);
      showToast('VM durduruldu', 'info');
    } catch { showToast('Durdurulamadı', 'error'); }
    finally { setStopping(false); }
  };

  if (!vmData) {
    return (
      <button className="vm-start-btn" onClick={startVM} disabled={starting}>
        {starting ? '⏳ Başlatılıyor...' : '🚀 Senaryoyu Başlat'}
      </button>
    );
  }

  return (
    <div className="vm-active">
      <div className="vm-active-header">
        <div className="vm-active-dot" />
        <span className="vm-active-label">SENARYO AKTİF</span>
        <button className="vm-stop-btn" onClick={stopVM} disabled={stopping}>
          {stopping ? '...' : '⏹ Durdur'}
        </button>
      </div>
      <div className="vm-conn-info">
              {/* Sadece IP — tıklayınca kopyala */}
              <div
                className="vm-ip-copy"
                onClick={copyIP}
                title="Kopyalamak için tıkla"
              >
                <code>{vmData.ipAddress}</code>
                <span className="vm-ip-copy-hint">{copied ? '✓ Kopyalandı' : '📋 Kopyala'}</span>
              </div>
              {vmData.port && (
                <div style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)',padding:'4px 0',letterSpacing:1}}>
                  Port: <code style={{color:'#00d4ff'}}>{vmData.port}</code>
                </div>
              )}
        {vmData.terminalPort && (
          <a href={`http://${vmData.ipAddress}:${vmData.terminalPort}`} target="_blank" rel="noopener noreferrer" className="vm-terminal-btn">
            🖥️ Web Terminal
          </a>
        )}
      </div>
      {vmData.expiresAt && (
        <div className="vm-expires">⏱ {new Date(vmData.expiresAt).toLocaleTimeString('tr-TR')}'de kapanır</div>
      )}
    </div>
  );
};

/* ── Tek soru kartı ── */
const QuestionCard = ({ challenge, index, onSolved, onUnlock }) => {
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail]     = useState(null);
  const [flag, setFlag]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (detail) { setExpanded(e => !e); return; }
    try {
      const res = await api.get(`/challenges/${challenge.id}`);
      setDetail(res.data);
      setExpanded(true);
    } catch { showToast('Soru yüklenemedi', 'error'); }
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
        if (res.data.unlockContent) {
          try { onUnlock && onUnlock(JSON.parse(res.data.unlockContent), challenge.title); } catch {}
        }
        onSolved();
      } else {
        showToast(res.data.message || 'Yanlış flag', 'error');
      }
    } catch { showToast('Gönderilemedi', 'error'); }
    finally { setSubmitting(false); }
  };

  const hints = (() => {
    try { const raw = detail?.hints || detail?.Hints; return raw ? JSON.parse(raw) : []; } catch { return []; }
  })();

  const isLocked = !challenge.isUnlocked;
  const isSolved = challenge.isSolved;
  const icon     = CATEGORY_ICONS[challenge.category] || '📝';
  const BASE     = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace('/api', '');

  return (
    <div className={`question-card ${isLocked ? 'locked' : ''} ${isSolved ? 'solved' : ''} ${expanded ? 'expanded' : ''}`}>
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
          {!isLocked && !isSolved && <span className="expand-arrow">{expanded ? '▲' : '▼'}</span>}
        </div>
      </div>

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

          {/* Deliller */}
          {detail.evidences?.length > 0 && (
            <div className="question-files">
              <h4>🔬 Deliller</h4>
              <div className="evidence-grid">
                {detail.evidences.map(ev => {
                  const url = ev.fileUrl?.startsWith('http') ? ev.fileUrl : BASE + ev.fileUrl;
                  return <EvidenceThumb key={ev.id} evidence={ev} url={url} />;
                })}
              </div>
            </div>
          )}

          {/* VM */}
          {detail.hasVM && (
            <div className="question-vm">
              <h4>🖥️ Sanal Makine</h4>
              <VMButton challenge={detail} onStarted={() => api.get(`/challenges/${challenge.id}`).then(r => setDetail(r.data))} />
            </div>
          )}

          <HintButton hints={hints} challengeId={challenge.id} onHintUsed={onSolved} />

          {!isSolved ? (
            <form className="flag-form" onSubmit={submit}>
              <input type="text" placeholder="flag{...}" value={flag} onChange={e => setFlag(e.target.value)} className="flag-input" />
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
   Ana Play sayfası
══════════════════════════════════════════ */
const Play = () => {
  const { caseId } = useParams();
  const navigate   = useNavigate();
  const { showToast } = useToast();

  const [caseData,   setCaseData]   = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [boardTab,   setBoardTab]   = useState('detective');
  const [autoItems,  setAutoItems]  = useState([]);
  const [boardScale, setBoardScale] = useState(0.85);
  const [boardPan,   setBoardPan]   = useState({ x: 50, y: 80 });
  const hubRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [caseRes, chalRes] = await Promise.all([
        casesAPI.getById(caseId),
        api.get(`/challenges/case/${caseId}`),
      ]);
      setCaseData(caseRes.data);
      setChallenges(chalRes.data);
    } catch {}
    finally { setLoading(false); }
  }, [caseId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // SignalR — flag çözülünce anlık güncelleme
  useEffect(() => {
    if (!caseId) return;
    const token = localStorage.getItem('token');
    const hub = new signalR.HubConnectionBuilder()
      .withUrl(`${HUB_URL}?access_token=${token}`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    hub.on('ChallengeUnlocked', (json) => {
      try {
        const content = JSON.parse(json);
        handleUnlock(content, 'Takım üyesi');
        // Soruları yenile
        api.get(`/challenges/case/${caseId}`).then(r => setChallenges(r.data));
        showToast('🎉 Takım üyesi bir soruyu çözdü!', 'success');
      } catch {}
    });

    hub.start()
      .then(() => hub.invoke('JoinBoard', parseInt(caseId)))
      .catch(e => console.warn('SignalR:', e));

    hubRef.current = hub;
    return () => hub.stop();
  }, [caseId]); // eslint-disable-line

  const handleUnlock = useCallback((content, challengeTitle) => {
    if (!content) return;
    if (content.reportSection) {
      setAutoItems(prev => [...prev, {
        id: `report_${Date.now()}`,
        type: 'note',
        title: `📄 ${content.reportSection.title}`,
        text: content.reportSection.content,
      }]);
    }
    if (content.boardNote) {
      setAutoItems(prev => [...prev, {
        id: `note_${Date.now()}`,
        type: 'note',
        title: content.boardNote.title,
        text: content.boardNote.text,
      }]);
    }
    if (content.boardSuspect) {
      setAutoItems(prev => [...prev, {
        id: `suspect_${Date.now()}`,
        type: 'suspect',
        name: content.boardSuspect.name,
        role: content.boardSuspect.role,
        motive: content.boardSuspect.motive,
      }]);
    }
  }, []);

  if (loading) return <div className="loading">YÜKLENİYOR...</div>;
  if (!caseData) return <div className="error-message">Senaryo bulunamadı</div>;

  const solved = challenges.filter(c => c.isSolved).length;
  const total  = challenges.length;

  return (
    <div className="play-page">
      {/* ── Üst bar ── */}
      <div className="play-topbar">
        <button onClick={() => navigate(`/cases/${caseId}`)} className="btn btn-secondary btn-small">← Geri</button>
        <div className="play-title">{caseData.title}</div>
        <div className="play-progress">
          <span>{solved}/{total} çözüldü</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: total ? `${(solved / total) * 100}%` : '0%' }} />
          </div>
        </div>
      </div>

      <div className="play-body">
        {/* ── Panolar (tam ekran) ── */}
        <div className="play-boards">
          <div className="play-board-tabs">
            <button
              className={`play-board-tab ${boardTab === 'detective' ? 'active' : ''}`}
              onClick={() => setBoardTab('detective')}
            >
              🗺️ Dedektif Panosu
            </button>
            <button
              className={`play-board-tab ${boardTab === 'evidence' ? 'active' : ''}`}
              onClick={() => setBoardTab('evidence')}
            >
              📌 Delil Panosu
            </button>

            {/* ── Zoom kontrolleri — tab bar sağı ── */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px' }}>
              <button className="play-zoom-btn" onClick={() => setBoardScale(s => Math.min(2.0, s * 1.1))}>+</button>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#c9975a', minWidth: 36, textAlign: 'center' }}>
                {Math.round(boardScale * 100)}%
              </span>
              <button className="play-zoom-btn" onClick={() => setBoardScale(s => Math.max(0.3, s * 0.9))}>−</button>
              <button className="play-zoom-btn" onClick={() => { setBoardScale(0.85); setBoardPan({ x: 50, y: 80 }); }}>⌂</button>
            </div>
          </div>

          <div style={{ display: boardTab === 'detective' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
            <DetectiveBoard
              caseId={parseInt(caseId)}
              caseData={caseData}
              challenges={challenges}
              unlockedSections={[]}
              onChallengesSolved={fetchAll}
              onUnlock={handleUnlock}
              externalScale={boardScale}
              externalPan={boardPan}
              onScaleChange={setBoardScale}
              onPanChange={setBoardPan}
            />
          </div>

          <div style={{ display: boardTab === 'evidence' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
            <EvidenceBoard
              caseId={parseInt(caseId)}
              caseData={caseData}
              clues={[]}
              autoItems={autoItems}
              onUnlock={handleUnlock}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Play;

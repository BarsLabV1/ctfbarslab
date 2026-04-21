import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import CrimeSceneReport from './CrimeSceneReport';
import './DetectiveBoard.css';

const HUB_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api')
  .replace('/api', '/hubs/board');

const CATEGORY_ICONS = {
  OSINT: '🔍', Web: '🌐', Forensics: '🔬', Crypto: '🔐',
  Reverse: '⚙️', PWN: '💣', Network: '📡', Final: '🎯',
};

/* ── Kart pozisyonları (sabit layout) ── */
const getCardLayout = (challenges) => {
  const positions = [
    { x: 900,  y: 150 },
    { x: 1200, y: 300 },
    { x: 1500, y: 150 },
    { x: 1800, y: 300 },
    { x: 2100, y: 150 },
    { x: 2400, y: 300 },
    { x: 2700, y: 150 },
  ];
  return challenges.map((ch, i) => ({
    ...ch,
    pos: positions[i % positions.length],
    rot: (i % 2 === 0 ? -1 : 1) * (1 + (i % 3)),
  }));
};

/* ── İp çizimi için merkez noktası ── */
const cardCenter = (pos, w = 200, h = 240) => ({
  x: pos.x + w / 2,
  y: pos.y + 15,
});

/* ══════════════════════════════════════════
   Ana Component
══════════════════════════════════════════ */
const DetectiveBoard = ({ caseId, caseData, challenges: initialChallenges = [], unlockedSections = [] }) => {
  const { showToast } = useToast();
  const viewportRef = useRef(null);
  const hubRef      = useRef(null);

  // Pan/Zoom state
  const [pan,   setPan]   = useState({ x: -100, y: -50 });
  const [scale, setScale] = useState(0.75);
  const isPanning = useRef(false);
  const panStart  = useRef({ x: 0, y: 0 });

  // Board state
  const [challenges, setChallenges] = useState(() => getCardLayout(initialChallenges));
  const [strings,    setStrings]    = useState([]);
  const [userNotes,  setUserNotes]  = useState([]);
  const [suspects,   setSuspects]   = useState([]);

  // UI state
  const [selectedCard,  setSelectedCard]  = useState(null); // sağ panel (flag girişi)
  const [viewCard,      setViewCard]      = useState(null); // büyük popup
  const [viewReport,    setViewReport]    = useState(false);
  const [flagInput,     setFlagInput]     = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [showAddNote,   setShowAddNote]   = useState(false);
  const [newNote,       setNewNote]       = useState({ title: '', text: '' });
  const [cardDetails,   setCardDetails]   = useState({}); // id → detail cache

  // Sync challenges when prop changes
  useEffect(() => {
    setChallenges(getCardLayout(initialChallenges));
  }, [initialChallenges]);

  /* ── SignalR ── */
  useEffect(() => {
    if (!caseId) return;
    const token = localStorage.getItem('token');
    const hub = new signalR.HubConnectionBuilder()
      .withUrl(`${HUB_URL}?access_token=${token}`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    hub.on('BoardLoaded', (json) => {
      try {
        const state = JSON.parse(json);
        if (state.userNotes) setUserNotes(state.userNotes);
        if (state.strings)   setStrings(state.strings);
        if (state.suspects)  setSuspects(state.suspects);
      } catch {}
    });

    hub.on('BoardUpdated', (json) => {
      try {
        const state = JSON.parse(json);
        if (state.userNotes) setUserNotes(state.userNotes);
        if (state.strings)   setStrings(state.strings);
        if (state.suspects)  setSuspects(state.suspects);
      } catch {}
    });

    hub.start()
      .then(() => hub.invoke('JoinBoard', caseId))
      .catch(e => console.warn('SignalR:', e));

    hubRef.current = hub;
    return () => hub.stop();
  }, [caseId]);

  const broadcast = useCallback((notes, strs, sups) => {
    if (!hubRef.current) return;
    hubRef.current.invoke('UpdateBoard', caseId,
      JSON.stringify({ userNotes: notes, strings: strs, suspects: sups })
    ).catch(() => {});
  }, [caseId]);

  /* ── Pan/Zoom ── */
  const onMouseDown = (e) => {
    if (viewCard || viewReport || showAddNote) return;
    if (e.target.closest('.db-card') || e.target.closest('.db-panel')) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const onMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  }, []);

  const onMouseUp = () => { isPanning.current = false; };

  const onWheel = (e) => {
    // Popup açıksa scroll'u engelle
    if (viewCard || viewReport || showAddNote) return;
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const vp = viewportRef.current.getBoundingClientRect();
      const xs = (e.clientX - vp.left - pan.x) / scale;
      const ys = (e.clientY - vp.top  - pan.y) / scale;
      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      const newScale = Math.min(Math.max(0.3, scale * delta), 2.0);
      setPan({ x: e.clientX - vp.left - xs * newScale, y: e.clientY - vp.top - ys * newScale });
      setScale(newScale);
    } else {
      setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  /* ── Kart tıklama: detay yükle + popup aç ── */
  const openCard = useCallback(async (ch) => {
    if (!ch.isUnlocked) return;
    setSelectedCard(ch);
    // Detay cache'de yoksa yükle
    if (!cardDetails[ch.id]) {
      try {
        const res = await api.get(`/challenges/${ch.id}`);
        setCardDetails(prev => ({ ...prev, [ch.id]: res.data }));
      } catch {}
    }
  }, [cardDetails]);

  const openCardPopup = useCallback(async (ch) => {
    if (!ch.isUnlocked) return;
    setViewCard(ch);
    if (!cardDetails[ch.id]) {
      try {
        const res = await api.get(`/challenges/${ch.id}`);
        setCardDetails(prev => ({ ...prev, [ch.id]: res.data }));
      } catch {}
    }
  }, [cardDetails]);
  const submitFlag = async (challengeId) => {
    if (!flagInput.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/challenges/${challengeId}/submit`, { flag: flagInput });
      if (res.data.success) {
        showToast(`✅ Doğru! +${res.data.points} puan`, 'success');
        setFlagInput('');
        setSelectedCard(null);
        // Unlock content
        if (res.data.unlockContent) {
          try {
            const content = JSON.parse(res.data.unlockContent);
            if (content.boardSuspect) {
              const newSus = [...suspects, { id: `sus_${Date.now()}`, ...content.boardSuspect, x: 400 + suspects.length * 220, y: 1600 }];
              setSuspects(newSus);
              broadcast(userNotes, strings, newSus);
            }
            if (content.boardNote) {
              const newNotes = [...userNotes, { id: `note_${Date.now()}`, ...content.boardNote, x: 400 + userNotes.length * 200, y: 1200, color: '#bacb9a', rot: -1 }];
              setUserNotes(newNotes);
              broadcast(newNotes, strings, suspects);
            }
          } catch {}
        }
        // Refresh challenges
        const chalRes = await api.get(`/challenges/case/${caseId}`);
        setChallenges(getCardLayout(chalRes.data));
      } else {
        showToast(res.data.message, 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gönderilemedi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── İp çizgisi hesapla ── */
  const getStringPath = (from, to) => {
    const a = from;
    const b = to;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - 30;
    return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
  };

  /* ── Senaryo kartı merkezi ── */
  const scenarioCenter = { x: 300 + 180, y: 300 + 15 };

  /* ── Render ── */
  const solvedIds = new Set(challenges.filter(c => c.isSolved).map(c => c.id));

  return (
    <div
      ref={viewportRef}
      className="db-viewport"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      <div
        className="db-board"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
      >
        {/* ── SVG İpler ── */}
        <svg className="db-svg">
          {/* Senaryo → her soru */}
          {challenges.map(ch => {
            const from = scenarioCenter;
            const to   = cardCenter(ch.pos);
            const locked = !ch.isUnlocked;
            return (
              <path
                key={`s_${ch.id}`}
                d={getStringPath(from, to)}
                className={`db-string ${locked ? 'locked' : 'unlocked'}`}
              />
            );
          })}
          {/* Kullanıcı ipleri */}
          {strings.map(s => {
            const fromNote = userNotes.find(n => n.id === s.fromId);
            const toNote   = userNotes.find(n => n.id === s.toId) || suspects.find(n => n.id === s.toId);
            if (!fromNote || !toNote) return null;
            return (
              <path
                key={s.id}
                d={getStringPath(
                  { x: fromNote.x + 100, y: fromNote.y + 15 },
                  { x: toNote.x + 100,   y: toNote.y + 15 }
                )}
                className="db-string unlocked"
              />
            );
          })}
        </svg>

        {/* ── Senaryo Kartı ── */}
        {caseData && (
          <div className="db-card db-scenario-card" style={{ left: 300, top: 300, transform: 'rotate(-1deg)' }}>
            <div className="db-pin db-pin-red"/>
            <div className="db-card-stamp">GİZLİ</div>
            <div className="db-scenario-badge">🛡️</div>
            <div className="db-scenario-title">{caseData.title}</div>
            <div className="db-scenario-desc">{(caseData.story || caseData.description || '').slice(0, 120)}...</div>
            <div className="db-scenario-meta">
              <span>⭐ {caseData.totalPoints} puan</span>
              <span>🎯 {challenges.length} soru</span>
            </div>
            <button className="db-report-btn" onClick={() => setViewReport(true)}>
              📄 Olay Yeri Raporu
            </button>
          </div>
        )}

        {/* ── Soru Kartları ── */}
        {challenges.map(ch => {
          const locked  = !ch.isUnlocked;
          const solved  = ch.isSolved;
          const icon    = CATEGORY_ICONS[ch.category] || '📝';
          const isOpen  = selectedCard?.id === ch.id;

          return (
            <div
              key={ch.id}
              className={`db-card db-challenge-card ${locked ? 'db-locked' : ''} ${solved ? 'db-solved' : ''} ${isOpen ? 'db-open' : ''}`}
              style={{ left: ch.pos.x, top: ch.pos.y, transform: `rotate(${ch.rot}deg)` }}
              onClick={() => !locked && openCardPopup(ch)}
              onDoubleClick={e => { e.stopPropagation(); !locked && openCardPopup(ch); }}
            >
              <div className="db-pin"/>
              {locked && <div className="db-lock-icon">🔒</div>}
              {solved && <div className="db-solved-stamp">ÇÖZÜLDÜ</div>}
              <div className="db-card-icon">{icon}</div>
              <div className="db-card-order">#{ch.order}</div>
              <div className="db-card-title">{ch.title}</div>
              <div className="db-card-cat">{ch.category}</div>
              <div className="db-card-pts">⭐ {ch.points}</div>
              {locked && ch.requiredChallengeTitle && (
                <div className="db-card-req">🔒 {ch.requiredChallengeTitle}</div>
              )}
            </div>
          );
        })}

        {/* ── Kullanıcı Notları ── */}
        {userNotes.map(n => (
          <div
            key={n.id}
            className="db-card db-user-note"
            style={{ left: n.x, top: n.y, background: n.color || '#bacb9a', transform: `rotate(${n.rot || -1}deg)` }}
          >
            <div className="db-pin"/>
            <div className="db-note-title">{n.title}</div>
            <div className="db-note-text">{n.text}</div>
          </div>
        ))}

        {/* ── Şüpheliler ── */}
        {suspects.map(s => (
          <div
            key={s.id}
            className="db-card db-suspect-card"
            style={{ left: s.x, top: s.y, transform: 'rotate(-1.5deg)' }}
          >
            <div className="db-pin db-pin-red"/>
            {s.imageUrl ? (
              <img src={s.imageUrl} alt={s.name} className="db-suspect-photo"/>
            ) : (
              <div className="db-suspect-avatar">{s.name.charAt(0).toUpperCase()}</div>
            )}
            <div className="db-suspect-name">{s.name}</div>
            {s.role   && <div className="db-suspect-role">{s.role}</div>}
            {s.motive && <div className="db-suspect-motive">⚠️ {s.motive}</div>}
          </div>
        ))}
      </div>

      {/* ── Açık Soru Paneli (sağ kenar) ── */}
      {/* ── Üst araç çubuğu ── */}
      <div className="db-toolbar">
        <button className="db-tool-btn" onClick={() => setShowAddNote(true)}>+ Not</button>
        <div className="db-zoom-info">{Math.round(scale * 100)}%</div>
        <button className="db-tool-btn" onClick={() => setScale(s => Math.min(2.0, s * 1.1))}>+</button>
        <button className="db-tool-btn" onClick={() => setScale(s => Math.max(0.3, s * 0.9))}>−</button>
        <button className="db-tool-btn" onClick={() => { setPan({ x: -100, y: -50 }); setScale(0.75); }}>
          ⌂
        </button>
      </div>

      {/* ── Not ekleme modal ── */}
      {showAddNote && (
        <div className="db-modal-overlay" onClick={() => setShowAddNote(false)}>
          <div className="db-modal" onClick={e => e.stopPropagation()}>
            <h3>Yeni Not</h3>
            <input placeholder="Başlık" value={newNote.title} onChange={e => setNewNote(n => ({ ...n, title: e.target.value }))} />
            <textarea rows={4} placeholder="İçerik" value={newNote.text} onChange={e => setNewNote(n => ({ ...n, text: e.target.value }))} />
            <div className="db-modal-actions">
              <button className="db-modal-btn-ok" onClick={() => {
                if (!newNote.title.trim()) return;
                const n = { id: `note_${Date.now()}`, ...newNote, x: 600 + userNotes.length * 210, y: 1100, color: '#bacb9a', rot: -1 };
                const updated = [...userNotes, n];
                setUserNotes(updated);
                broadcast(updated, strings, suspects);
                setNewNote({ title: '', text: '' });
                setShowAddNote(false);
              }}>Ekle</button>
              <button className="db-modal-btn-cancel" onClick={() => setShowAddNote(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Kart büyük popup ── */}
      {viewCard && (
        <div className="db-modal-overlay" onClick={() => setViewCard(null)}>
          <div className="db-card-popup" onClick={e => e.stopPropagation()}>
            <button className="db-panel-close" onClick={() => setViewCard(null)}>✕</button>

            {/* Kağıt efekti */}
            <div className="db-card-popup-paper">
              <div className="db-card-popup-pin"/>
              {viewCard.isSolved && <div className="db-card-popup-stamp">ÇÖZÜLDÜ</div>}

              <div className="db-card-popup-header">
                <span className="db-card-popup-icon">{CATEGORY_ICONS[viewCard.category] || '📝'}</span>
                <div>
                  <div className="db-card-popup-title">{viewCard.title}</div>
                  <div className="db-card-popup-meta">
                    <span className="db-panel-cat">{viewCard.category}</span>
                    <span className="db-panel-pts">⭐ {viewCard.points}</span>
                  </div>
                </div>
              </div>

              <div className="db-card-popup-divider"/>

              <p className="db-card-popup-desc">
                {cardDetails[viewCard.id]?.description || viewCard.description}
              </p>

              {/* Deliller */}
              {cardDetails[viewCard.id]?.evidences?.length > 0 && (
                <div className="db-card-popup-section">
                  <div className="db-card-popup-section-title">🔬 Deliller</div>
                  <div className="db-card-popup-evidences">
                    {cardDetails[viewCard.id].evidences.map(ev => {
                      const base = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace('/api','');
                      const url  = ev.fileUrl?.startsWith('http') ? ev.fileUrl : base + ev.fileUrl;
                      return (
                        <div key={ev.id} className="db-evidence-item">
                          {ev.type === 'video' && <video src={url} controls className="db-evidence-video"/>}
                          {ev.type === 'audio' && <audio src={url} controls className="db-evidence-audio"/>}
                          {ev.type === 'image' && <img src={url} alt={ev.title} className="db-evidence-image"/>}
                          {!['video','audio','image'].includes(ev.type) && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="db-evidence-file">
                              {ev.type==='document'?'📄':ev.type==='log'?'📋':'📁'} {ev.title}
                            </a>
                          )}
                          <div className="db-evidence-title">{ev.title}</div>
                          {ev.description && <div className="db-evidence-desc">{ev.description}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* İpuçları */}
              {(() => {
                const hints = (() => {
                  try {
                    const raw = cardDetails[viewCard.id]?.hints || viewCard.hints;
                    return raw ? JSON.parse(raw) : [];
                  } catch { return []; }
                })();
                if (!hints.length) return null;
                return (
                  <div className="db-card-popup-section">
                    <div className="db-card-popup-section-title">💡 İpuçları</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {hints.map((h, i) => (
                        <div key={i} className="db-hint-item">
                          <span>İpucu {i+1} (-%{h.PenaltyPercent || h.penaltyPercent})</span>
                          <button className="db-hint-btn" onClick={async () => {
                            try {
                              const res = await api.post(`/challenges/${viewCard.id}/use-hint`, { hintIndex: i });
                              showToast(`💡 ${res.data.text}`, 'warning');
                            } catch {}
                          }}>Göster</button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Flag girişi */}
              {!viewCard.isSolved && (
                <div className="db-card-popup-flag">
                  <div className="db-card-popup-section-title">🚩 Flag Gir</div>
                  <div className="db-flag-row">
                    <input
                      className="db-flag-input"
                      placeholder="CTF{...}"
                      value={flagInput}
                      onChange={e => setFlagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitFlag(viewCard.id)}
                    />
                    <button className="db-flag-btn" onClick={() => submitFlag(viewCard.id)} disabled={submitting}>
                      {submitting ? '...' : 'Gönder'}
                    </button>
                  </div>
                </div>
              )}
              {viewCard.isSolved && <div className="db-panel-solved">✅ Bu soruyu çözdünüz!</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Rapor popup ── */}
      {viewReport && caseData && (
        <div className="db-modal-overlay db-report-overlay" onClick={() => setViewReport(false)}>
          <div className="db-report-popup" onClick={e => e.stopPropagation()}>
            <button className="db-report-close" onClick={() => setViewReport(false)}>✕ Kapat</button>
            <CrimeSceneReport caseData={caseData} unlockedSections={unlockedSections} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectiveBoard;

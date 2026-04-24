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

/* ── VM Panel ── */
const VMPanel = ({ challenges, caseId, onRefresh }) => {
  const { showToast } = useToast();
  const [vmData,       setVmData]       = useState(null);
  const [starting,     setStarting]     = useState(false);
  const [stopping,     setStopping]     = useState(false);
  const [kaliPort,     setKaliPort]     = useState(null);
  const [startingKali, setStartingKali] = useState(false);
  const [open,         setOpen]         = useState(false);
  const [selVmIdx,     setSelVmIdx]     = useState(0);

  // VM olan tüm sorular
  const vmChallenges = challenges.filter(c => c.hasVM);
  const vmChallenge  = vmChallenges[selVmIdx] || vmChallenges[0] || null;

  if (!vmChallenge) return null;

  const startVM = async () => {
    setStarting(true);
    try {
      const res = await api.post(`/challenges/${vmChallenge.id}/start-vm`);
      setVmData(res.data);
      showToast(res.data.webUrl ? 'Web sitesi hazır!' : `VM başlatıldı!`, 'success');
      onRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'VM başlatılamadı', 'error');
    } finally { setStarting(false); }
  };

  const stopVM = async () => {
    setStopping(true);
    try {
      await api.post(`/challenges/${vmChallenge.id}/stop-vm`);
      setVmData(null); setKaliPort(null);
      showToast('VM durduruldu', 'info');
      onRefresh();
    } catch { showToast('Durdurulamadı', 'error'); }
    finally { setStopping(false); }
  };

  return (
    <div className="db-vm-panel">
      <button className="db-vm-toggle" onClick={() => setOpen(o => !o)}>
        🖥️ VM {open ? '▲' : '▼'}
      </button>

      {open && (
        <div className="db-vm-content">
          <div className="db-vm-title">{vmChallenge.title}</div>

          {/* Birden fazla VM varsa seçim */}
          {vmChallenges.length > 1 && (
            <select
              className="db-vm-select"
              value={selVmIdx}
              onChange={e => { setSelVmIdx(parseInt(e.target.value)); setVmData(null); setKaliPort(null); }}
            >
              {vmChallenges.map((ch, i) => (
                <option key={ch.id} value={i} disabled={!ch.isUnlocked}>
                  #{ch.order} {ch.title} {!ch.isUnlocked ? '🔒' : ''}
                </option>
              ))}
            </select>
          )}

          {!vmData ? (
            <button className="db-vm-start" onClick={startVM} disabled={starting}>
              {starting ? '⏳ Başlatılıyor...' : '🚀 Makineyi Başlat'}
            </button>
          ) : (
            <>
              <div className="db-vm-status">
                <span className="db-vm-dot"/>
                <span>Çalışıyor</span>
              </div>

              {/* Web sitesi varsa büyük buton */}
              {vmData.webUrl && (
                <a href={vmData.webUrl} target="_blank" rel="noopener noreferrer" className="db-vm-web-btn">
                  🌐 Web Sitesini Aç
                </a>
              )}

              {/* SSH bilgisi */}
              {!vmData.webUrl && (
                <div className="db-vm-info">
                  <span>SSH:</span>
                  <code>{vmData.ipAddress}:{vmData.port}</code>
                </div>
              )}

              <div className="db-vm-btns">
                {vmData.terminalPort && (
                  <a href={`http://localhost:${vmData.terminalPort}`} target="_blank" rel="noopener noreferrer" className="db-vm-btn-sec">
                    🖥️ Terminal Aç
                  </a>
                )}
                <button className="db-vm-btn-stop" onClick={stopVM} disabled={stopping}>
                  {stopping ? '...' : '⏹ Durdur'}
                </button>
              </div>

              {vmData.expiresAt && (
                <div className="db-vm-expires">
                  ⏱ {new Date(vmData.expiresAt).toLocaleTimeString('tr-TR')}'de kapanır
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Admin kart popup içeriği ── */
const AdminCardContent = ({ card }) => {
  const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace('/api', '');

  if (card.type === 'note' || card.type === 'document') {
    return <p className="db-card-popup-desc" style={{whiteSpace:'pre-line'}}>{card.content}</p>;
  }
  if (card.type === 'photo') {
    return <img src={BASE + card.fileUrl} alt={card.title} style={{width:'100%',borderRadius:4,border:'2px solid rgba(0,0,0,0.2)'}}/>;
  }
  if (card.type === 'video') {
    return <video src={BASE + card.fileUrl} controls autoPlay style={{width:'100%',borderRadius:4}}/>;
  }
  if (card.type === 'audio') {
    return (
      <div style={{padding:'20px 0'}}>
        <audio src={BASE + card.fileUrl} controls style={{width:'100%'}}/>
        {card.content && <p className="db-card-popup-desc" style={{marginTop:12}}>{card.content}</p>}
      </div>
    );
  }
  if (card.type === 'website') {
    return (
      <div>
        <p className="db-card-popup-desc" style={{marginBottom:12}}>
          Hedef: <code style={{color:'#34d399'}}>{card.externalUrl}</code>
        </p>
        <iframe
          src={card.externalUrl}
          title={card.title}
          style={{width:'100%',height:400,border:'1px solid rgba(0,0,0,0.2)',borderRadius:4}}
          sandbox="allow-same-origin allow-scripts allow-forms"
        />
      </div>
    );
  }
  if (card.type === 'terminal') {
    return (
      <div>
        <p className="db-card-popup-desc" style={{marginBottom:12}}>
          Docker Image: <code style={{color:'#34d399'}}>{card.dockerImage}</code>
        </p>
        <p className="db-card-popup-desc">VM başlatmak için Sorular sekmesindeki VM panelini kullanın.</p>
      </div>
    );
  }
  return <p className="db-card-popup-desc">{card.content || 'İçerik yok'}</p>;
};

/* ── Admin Board Card (panoya admin tarafından eklenen) ── */
const AdminBoardCard = ({ card, onClick, onDragStart, wasDragged }) => {
  const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace('/api', '');
  const locked = !card.isUnlocked;

  const TYPE_ICONS = {
    note: '📝', photo: '🖼️', video: '🎥', document: '📄',
    terminal: '💻', website: '🌐', audio: '🎵',
  };

  return (
    <div
      className={`db-card db-admin-card db-admin-${card.type} ${locked ? 'db-locked' : ''}`}
      style={{
        left: card.posX,
        top: card.posY,
        transform: `rotate(${card.rotation}deg)`,
        background: card.type === 'note' ? (card.color || '#bacb9a') : undefined,
      }}
      onMouseDown={e => !locked && onDragStart(e)}
      onClick={() => {
        if (wasDragged && wasDragged.current) return;
        !locked && onClick();
      }}
    >
      <div className="db-pin"/>
      {locked && <div className="db-lock-icon">🔒</div>}
      <div className="db-admin-card-icon">{TYPE_ICONS[card.type] || '📁'}</div>
      <div className="db-admin-card-title">{card.title}</div>
      {card.type === 'note' && card.content && (
        <div className="db-admin-card-preview">{card.content.slice(0, 80)}{card.content.length > 80 ? '...' : ''}</div>
      )}
      {card.type === 'photo' && card.fileUrl && (
        <img src={BASE + card.fileUrl} alt={card.title} className="db-admin-card-thumb"/>
      )}
      {['video','audio','document','terminal','website'].includes(card.type) && (
        <div className="db-admin-card-hint">Tıkla → Görüntüle</div>
      )}
    </div>
  );
};

/* ── Kart pozisyonları — sıralı zincir layout ── */
const getCardLayout = (challenges) => {
  // Sorular soldan sağa zincir şeklinde dizilir
  return challenges.map((ch, i) => ({
    ...ch,
    pos: {
      x: 800 + i * 320,
      y: 200 + (i % 2 === 0 ? 0 : 160),
    },
    rot: (i % 2 === 0 ? -1.5 : 1.5),
  }));
};

/* ── İp çizimi için merkez noktası ── */
const cardCenter = (pos) => ({
  x: pos.x + 100,
  y: pos.y + 120,
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
  const [boardCards, setBoardCards] = useState([]); // admin kartları
  const [evidences,  setEvidences]  = useState([]); // delil kartları

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

  // Admin board kartlarını ve delilleri yükle
  useEffect(() => {
    if (!caseId) return;
    api.get(`/board-cards/case/${caseId}`)
      .then(res => setBoardCards(res.data))
      .catch(() => {});
    // Delilleri yükle — public endpoint
    api.get(`/challenges/case/${caseId}/evidences`)
      .then(res => setEvidences(res.data))
      .catch(() => {});
  }, [caseId, initialChallenges]);

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
  const adminDrag = useRef(null); // {id, ox, oy}
  const adminDragged = useRef(false); // sürükleme oldu mu?

  const onMouseDown = (e) => {
    if (viewCard || viewReport || showAddNote) return;
    if (e.target.closest('.db-card') || e.target.closest('.db-panel')) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const startAdminDrag = useCallback((e, cardId) => {
    e.preventDefault();
    e.stopPropagation();
    const vp = viewportRef.current.getBoundingClientRect();
    const bc = boardCards.find(c => c.id === cardId);
    if (!bc) return;
    const bx = (e.clientX - vp.left - pan.x) / scale;
    const by = (e.clientY - vp.top  - pan.y) / scale;
    adminDrag.current = { id: cardId, ox: bx - bc.posX, oy: by - bc.posY };
    adminDragged.current = false;
  }, [boardCards, pan, scale]);

  const onMouseMove = useCallback((e) => {
    // Admin kart sürükleme
    if (adminDrag.current) {
      const vp = viewportRef.current?.getBoundingClientRect();
      if (!vp) return;
      const bx = (e.clientX - vp.left - pan.x) / scale;
      const by = (e.clientY - vp.top  - pan.y) / scale;
      const dragId = adminDrag.current.id;
      if (!dragId) return;
      const newX = Math.round(bx - adminDrag.current.ox);
      const newY = Math.round(by - adminDrag.current.oy);
      adminDragged.current = true;
      setBoardCards(prev => prev.map(c =>
        c.id === dragId ? { ...c, posX: newX, posY: newY } : c
      ));
      return;
    }
    if (!isPanning.current) return;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  }, [pan, scale]);

  const onMouseUp = () => {
    if (adminDragged.current) {
      adminDragged.current = false;
    }
    adminDrag.current = null;
    isPanning.current = false;
  };

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
          {/* Soru → Soru zinciri (sıralı bağlantı) */}
          {challenges.map((ch, i) => {
            if (i === 0) return null;
            const prev = challenges[i - 1];
            const from = cardCenter(prev.pos);
            const to   = cardCenter(ch.pos);
            const locked = !ch.isUnlocked;
            return (
              <path
                key={`chain_${ch.id}`}
                d={getStringPath(from, to)}
                className={`db-string ${locked ? 'locked' : 'unlocked'}`}
              />
            );
          })}

          {/* Senaryo kartı → ilk soru */}
          {challenges.length > 0 && (
            <path
              key="scenario_first"
              d={getStringPath(scenarioCenter, cardCenter(challenges[0].pos))}
              className="db-string unlocked"
            />
          )}

          {/* Admin delil kartları → ilgili soru kartına ip */}
          {boardCards.map(bc => {
            if (!bc.unlockedByChallenge) return null;
            const relChallenge = challenges.find(c => c.id === bc.unlockedByChallenge);
            if (!relChallenge) return null;
            const from = { x: bc.posX + 80, y: bc.posY + 20 };
            const to   = cardCenter(relChallenge.pos);
            return (
              <path
                key={`ev_${bc.id}`}
                d={getStringPath(from, to)}
                className={`db-string ${bc.isUnlocked ? 'unlocked evidence-string' : 'locked'}`}
                strokeDasharray={bc.isUnlocked ? 'none' : '6,4'}
              />
            );
          })}

          {/* Delil kartları → ilgili soru kartına ip */}
          {evidences.map((ev) => {
            const relChallenge = challenges.find(c => c.id === ev.challengeId);
            if (!relChallenge) return null;
            const sameChEvidences = evidences.filter(e => e.challengeId === ev.challengeId);
            const evIdx = sameChEvidences.findIndex(e => e.id === ev.id);
            const evX = relChallenge.pos.x - 80 + evIdx * 180;
            const evY = relChallenge.pos.y + 300;
            const from = { x: evX + 80, y: evY + 10 };
            const to   = cardCenter(relChallenge.pos);
            return (
              <path
                key={`evip_${ev.id}`}
                d={getStringPath(from, to)}
                className="db-string unlocked evidence-string"
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

        {/* ── Admin Pano Kartları ── */}
        {boardCards.map(bc => (
          <AdminBoardCard
            key={bc.id}
            card={bc}
            onDragStart={(e) => startAdminDrag(e, bc.id)}
            wasDragged={adminDragged}
            onClick={() => setViewCard({ ...bc, isAdminCard: true })}
          />
        ))}

        {/* ── Delil Kartları (admin panelden eklenen) ── */}
        {evidences.map((ev) => {
          const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace('/api', '');
          const relChallenge = challenges.find(c => c.id === ev.challengeId);
          if (!relChallenge) return null;
          // Aynı soruya ait delillerin index'ini bul
          const sameChEvidences = evidences.filter(e => e.challengeId === ev.challengeId);
          const evIdx = sameChEvidences.findIndex(e => e.id === ev.id);
          const evX = relChallenge.pos.x - 80 + evIdx * 180;
          const evY = relChallenge.pos.y + 300;
          const TYPE_ICONS = { video:'🎥', audio:'🎵', image:'🖼️', document:'📄', log:'📋', file:'📁' };
          const icon = TYPE_ICONS[ev.type] || '📁';
          const url = ev.fileUrl?.startsWith('http') ? ev.fileUrl : BASE + ev.fileUrl;

          return (
            <div
              key={`ev_${ev.id}`}
              className="db-card db-evidence-card"
              style={{ left: evX, top: evY, transform: `rotate(${evIdx % 2 === 0 ? -1.5 : 1.5}deg)` }}
              onClick={() => setViewCard({ ...ev, isEvidenceCard: true, evUrl: url })}
            >
              <div className="db-pin db-pin-blue" />
              <div className="db-evidence-card-icon">{icon}</div>
              {ev.type === 'image' && (
                <img src={url} alt={ev.title} className="db-evidence-card-thumb" />
              )}
              <div className="db-evidence-card-title">{ev.title}</div>
              <div className="db-evidence-card-type">{ev.type?.toUpperCase()}</div>
            </div>
          );
        })}
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

      {/* ── VM Panel (sağ üst) ── */}
      {challenges.some(c => c.hasVM) && (
        <VMPanel challenges={challenges} caseId={caseId} onRefresh={() => {
          api.get(`/challenges/case/${caseId}`).then(r => setChallenges(getCardLayout(r.data)));
        }} />
      )}

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

              {/* Admin kartı içeriği */}
              {viewCard.isAdminCard ? (
                <AdminCardContent card={viewCard} />
              ) : viewCard.isEvidenceCard ? (
                <div className="db-card-popup-section">
                  {viewCard.type === 'video' && <video src={viewCard.evUrl} controls autoPlay style={{width:'100%',borderRadius:4}}/>}
                  {viewCard.type === 'audio' && <audio src={viewCard.evUrl} controls style={{width:'100%'}}/>}
                  {viewCard.type === 'image' && <img src={viewCard.evUrl} alt={viewCard.title} style={{width:'100%',borderRadius:4}}/>}
                  {!['video','audio','image'].includes(viewCard.type) && (
                    <a href={viewCard.evUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      📥 İndir / Aç
                    </a>
                  )}
                  {viewCard.description && <p className="db-card-popup-desc" style={{marginTop:12}}>{viewCard.description}</p>}
                </div>
              ) : (
                <p className="db-card-popup-desc">
                  {cardDetails[viewCard.id]?.description || viewCard.description}
                </p>
              )}

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

              {/* İpuçları — sadece soru kartlarında */}
              {!viewCard.isAdminCard && (() => {
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

              {/* Flag girişi — soru kartı popup'undan */}
              {!viewCard.isAdminCard && !viewCard.isSolved && (
                <div className="db-card-popup-flag">
                  <div className="db-card-popup-section-title">🚩 Flag Gir</div>
                  <div className="db-flag-row">
                    <input
                      className="db-flag-input"
                      placeholder="flag{...}"
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

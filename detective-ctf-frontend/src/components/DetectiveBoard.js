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
              {starting ? '⏳ Başlatılıyor...' : '🚀 Senaryoyu Başlat'}
            </button>
          ) : (
            <>
              <div className="db-vm-status">
                <span className="db-vm-dot"/>
                <span>Çalışıyor</span>
              </div>

              {/* Sadece IP — tıklayınca kopyala */}
              <div
                className="db-vm-ip-copy"
                onClick={() => {
                  navigator.clipboard?.writeText(vmData.ipAddress).catch(() => {});
                  const el = document.getElementById('db-vm-copy-hint');
                  if (el) { el.textContent = '✓ Kopyalandı'; setTimeout(() => { el.textContent = '📋 Kopyala'; }, 2000); }
                }}
                title="Kopyalamak için tıkla"
              >
                <code>{vmData.ipAddress}</code>
                <span id="db-vm-copy-hint" style={{fontSize:9,color:'var(--text-muted)',fontFamily:'var(--font-mono)',letterSpacing:1}}>📋 Kopyala</span>
              </div>
              {vmData.port && (
                <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)',padding:'2px 0',letterSpacing:1}}>
                  Port: <code style={{color:'#00d4ff'}}>{vmData.port}</code>
                </div>
              )}

              <div className="db-vm-btns">
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

/* ── Kart pozisyonları — API'den gelen posX/posY kullan ── */
const getCardLayout = (challenges) => {
  return challenges.map((ch, i) => ({
    ...ch,
    pos: {
      // Admin panelden ayarlanmışsa onu kullan (posX veya posY sıfırdan farklıysa)
      x: (ch.posX !== undefined && ch.posX !== null && ch.posX !== 0) ? ch.posX : 600 + i * 300,
      y: (ch.posY !== undefined && ch.posY !== null && ch.posY !== 0) ? ch.posY : 180 + (i % 2 === 0 ? 0 : 140),
    },
    rot: (i % 2 === 0 ? -1.5 : 1.5),
  }));
};

/* ── İp çizimi için merkez noktası — raptiyenin tam yeri ── */
const cardCenter = (pos) => ({
  x: pos.x + 95,  // kartın yatay ortası (190/2)
  y: pos.y - 2,   // raptiyenin tam üstü
});

/* ══════════════════════════════════════════
   Ana Component
══════════════════════════════════════════ */
const DetectiveBoard = ({ caseId, caseData, challenges: initialChallenges = [], unlockedSections = [], externalScale, externalPan, onScaleChange, onPanChange }) => {
  const { showToast } = useToast();
  const viewportRef = useRef(null);
  const hubRef      = useRef(null);
  const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace('/api', '');

  // Pan/Zoom state — external prop varsa onu kullan
  const [pan,   setPan]   = useState(externalPan   || { x: 50, y: 80 });
  const [scale, setScale] = useState(externalScale || 0.85);

  useEffect(() => { if (externalScale !== undefined) setScale(externalScale); }, [externalScale]);
  useEffect(() => { if (externalPan   !== undefined) setPan(externalPan);     }, [externalPan]);

  const handleSetScale = useCallback((fn) => {
    setScale(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      if (onScaleChange) onScaleChange(next);
      return next;
    });
  }, [onScaleChange]);

  const handleSetPan = useCallback((fn) => {
    setPan(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      if (onPanChange) onPanChange(next);
      return next;
    });
  }, [onPanChange]);

  const isPanning = useRef(false);
  const panStart  = useRef({ x: 0, y: 0 });

  // Board state
  const [challenges, setChallenges] = useState(() => getCardLayout(initialChallenges));
  const [strings,    setStrings]    = useState([]);
  const [userNotes,  setUserNotes]  = useState([]);
  const [suspects,   setSuspects]   = useState([]);
  const [boardCards, setBoardCards] = useState([]); // admin kartları
  const [evidences,  setEvidences]  = useState([]); // delil kartları
  const [adminStrings, setAdminStrings] = useState([]); // admin'den çekilen ipler

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
      .then(res => {
        const all = res.data;
        // String kartlarını ip olarak parse et, diğerleri normal kart
        const stringCards = all.filter(c => c.type === 'string');
        const normalCards = all.filter(c => c.type !== 'string');
        setBoardCards(normalCards);
        // İpleri state'e ekle (userNotes/strings ile birleştir)
        const parsedStrings = stringCards.map(c => {
          try {
            const data = JSON.parse(c.content || '{}');
            return { id: `admin_${c.id}`, ...data, isAdmin: true };
          } catch { return null; }
        }).filter(Boolean);
        if (parsedStrings.length > 0) {
          setAdminStrings(parsedStrings);
        }
      })
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
    handleSetPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  }, [pan, scale]);

  const onMouseUp = () => {
    if (adminDragged.current) {
      adminDragged.current = false;
    }
    adminDrag.current = null;
    isPanning.current = false;
  };

  const onWheel = useCallback((e) => {
    if (viewCard || viewReport || showAddNote) return;
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const vp = viewportRef.current.getBoundingClientRect();
      const xs = (e.clientX - vp.left - pan.x) / scale;
      const ys = (e.clientY - vp.top  - pan.y) / scale;
      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      const newScale = Math.min(Math.max(0.3, scale * delta), 2.0);
      handleSetPan({ x: e.clientX - vp.left - xs * newScale, y: e.clientY - vp.top - ys * newScale });
      handleSetScale(newScale);
    } else {
      handleSetPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  }, [pan, scale, viewCard, viewReport, showAddNote, handleSetPan, handleSetScale]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

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
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  };

  /* ── Senaryo kartı merkezi ── */
  const scenarioCenter = { x: 120 + 120, y: 180 - 2 };

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
    >
      <div
        className="db-board"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          backgroundImage: `url(${process.env.PUBLIC_URL}/pano-cercevesiz.png)`,
          backgroundSize: '1024px 576px',
          backgroundRepeat: 'repeat',
        }}
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

          {/* Admin'den çekilen ipler */}
          {adminStrings.map(s => {
            const getCenter = (kind, id) => {
              if (kind === 'question') {
                const ch = challenges.find(c => c.id === parseInt(id));
                return ch ? cardCenter(ch.pos) : null;
              } else {
                const bc = boardCards.find(c => c.id === parseInt(id));
                return bc ? { x: bc.posX + 80, y: bc.posY + 20 } : null;
              }
            };
            const from = getCenter(s.fromKind, s.fromId);
            const to   = getCenter(s.toKind,   s.toId);
            if (!from || !to) return null;
            return (
              <path
                key={`admin_str_${s.id}`}
                d={getStringPath(from, to)}
                stroke="#c0392b"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                opacity={0.85}
              />
            );
          })}
        </svg>

        {/* ── Senaryo Kartı — Olay dosyası ── */}
        {caseData && (
          <div className="db-card db-scenario-card" style={{ left: 120, top: 180, transform: 'rotate(-1.5deg)' }}>
            <div className="db-pin db-pin-red"/>
            <div className="db-card-stamp">GİZLİ</div>
            {/* Dosya numarası */}
            <div style={{fontFamily:'Courier New',fontSize:8,color:'rgba(0,0,0,0.4)',marginBottom:6,letterSpacing:1}}>
              DOSYA #{String(caseData.id || 1).padStart(4,'0')}
            </div>
            <div className="db-scenario-title">{caseData.title}</div>
            <div className="db-scenario-desc">{(caseData.story || caseData.description || '').slice(0, 100)}...</div>
            <div className="db-scenario-meta">
              <span>⭐ {caseData.totalPoints}</span>
              <span>🎯 {challenges.length} soru</span>
            </div>
            <button className="db-report-btn" onClick={() => setViewReport(true)}>
              📄 Olay Yeri Raporu
            </button>
          </div>
        )}

        {/* ── Soru Kartları — Polaroid CSS stili ── */}
        {challenges.map(ch => {
          const locked = !ch.isUnlocked;
          const solved = ch.isSolved;
          const icon   = CATEGORY_ICONS[ch.category] || '📝';

          // Kategori rengi — fotoğraf alanı arka planı
          const catBg = {
            OSINT:'#1a2a1a', Web:'#0d1a2e', Forensics:'#2a1a1a',
            Crypto:'#1a1a2e', Reverse:'#1a2a1a', PWN:'#2a1a0d',
            Network:'#0d2a2a', Final:'#2a2a0d', SSH:'#1a2a0d',
          };
          const bg = catBg[ch.category] || '#1a1a1a';

          return (
            <div
              key={ch.id}
              className={`db-card ${locked ? 'db-locked' : ''}`}
              style={{
                left: ch.pos.x, top: ch.pos.y,
                transform: `rotate(${ch.rot}deg)`,
                width: 190, height: 240,
                cursor: locked ? 'default' : 'pointer',
                position: 'absolute', zIndex: 2,
                background: '#f0ece0',
                boxShadow: '4px 6px 18px rgba(0,0,0,0.55), 8px 10px 28px rgba(0,0,0,0.35)',
                padding: '8px 8px 36px 8px',
                borderRadius: 2,
              }}
              onClick={() => !locked && openCardPopup(ch)}
            >
              {/* Kırmızı raptiye */}
              <div className="db-pin"/>

              {/* Kategori etiketi */}
              <div style={{
                position:'absolute', top:0, right:0,
                background: locked ? '#555' : solved ? '#8b0000' : '#5a3a00',
                color:'#f5e8d0', fontSize:7, fontWeight:900,
                padding:'3px 8px', letterSpacing:1,
                fontFamily:'"Courier New", Courier, monospace',
                zIndex:3,
              }}>{ch.category?.toUpperCase()}</div>

              {/* Sıra */}
              <div style={{
                position:'absolute', top:4, left:8,
                fontFamily:'"Courier New", Courier, monospace',
                fontSize:10, fontWeight:900,
                color:'rgba(60,30,10,0.45)', zIndex:3,
              }}>#{ch.order}</div>

              {/* Fotoğraf alanı — ikon büyük */}
              <div style={{
                width:'100%', height:'100%',
                background: locked ? '#111' : bg,
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                gap:8, overflow:'hidden', borderRadius:1,
                position:'relative',
              }}>
                {/* Kilitli overlay */}
                {locked && (
                  <div style={{
                    position:'absolute', inset:0,
                    background:'rgba(0,0,0,0.7)',
                    display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center',
                    gap:6, zIndex:5,
                  }}>
                    <span style={{fontSize:32}}>🔒</span>
                    {ch.requiredChallengeTitle && (
                      <span style={{
                        fontFamily:'"Courier New",monospace', fontSize:8,
                        color:'rgba(255,255,255,0.7)', textAlign:'center',
                        padding:'0 10px', lineHeight:1.4,
                      }}>"{ch.requiredChallengeTitle}"<br/>çözülmeli</span>
                    )}
                  </div>
                )}

                {/* ÇÖZÜLDÜ damgası */}
                {solved && (
                  <div style={{
                    position:'absolute', top:'50%', left:'50%',
                    transform:'translate(-50%,-50%) rotate(-12deg)',
                    border:'4px solid rgba(180,0,0,0.85)',
                    borderRadius:6, padding:'5px 12px',
                    zIndex:6, pointerEvents:'none',
                  }}>
                    <span style={{
                      fontFamily:'Impact, Arial Black, sans-serif',
                      fontSize:22, fontWeight:900,
                      color:'rgba(180,0,0,0.85)', letterSpacing:3,
                      display:'block',
                    }}>ÇÖZÜLDÜ</span>
                  </div>
                )}

                {/* Büyük ikon veya fotoğraf */}
                {ch.imageUrl
                  ? <img src={BASE + ch.imageUrl} alt={ch.title} style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute',inset:0,opacity:0.9,zIndex:2}}/>
                  : <span style={{fontSize:56, lineHeight:1, filter: solved ? 'grayscale(30%)' : 'none'}}>{icon}</span>
                }
              </div>

              {/* Alt beyaz şerit */}
              <div style={{
                position:'absolute', bottom:0, left:0, right:0,
                height:36, background:'#f0ece0',
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                borderTop:'1px solid rgba(0,0,0,0.08)',
                zIndex:4, padding:'0 6px',
              }}>
                <span style={{
                  fontFamily:'"Courier New", Courier, monospace',
                  fontSize:9, fontWeight:900, color:'#2a1a08',
                  textAlign:'center', textTransform:'uppercase',
                  letterSpacing:0.5, lineHeight:1.2,
                  overflow:'hidden', textOverflow:'ellipsis',
                  whiteSpace:'nowrap', maxWidth:'100%',
                }}>{ch.title}</span>
                <span style={{
                  fontFamily:'"Courier New", Courier, monospace',
                  fontSize:8, color:'#8b6030',
                }}>⭐ {ch.points}</span>
              </div>
            </div>
          );
        })}

        {/* ── Kullanıcı Notları — Sarı sticky note ── */}
        {userNotes.map(n => (
          <div
            key={n.id}
            className="db-card db-user-note"
            style={{
              left: n.x, top: n.y,
              transform: `rotate(${n.rot || -1}deg)`,
              background: '#f5e642',
            }}
          >
            <div className="db-pin"/>
            <div className="db-note-title">{n.title}</div>
            <div className="db-note-text">{n.text}</div>
          </div>
        ))}

        {/* ── Şüpheliler — Polaroid çerçeve ── */}
        {suspects.map(s => (
          <div
            key={s.id}
            className="db-card db-suspect-card"
            style={{
              left: s.x, top: s.y,
              transform: 'rotate(-1.5deg)',
              backgroundImage: `url('/polaroid-frame.png')`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              background: 'none',
            }}
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
            onDragStart={() => {}} /* kullanıcı sürükleyemez */
            wasDragged={adminDragged}
            onClick={() => setViewCard({ ...bc, isAdminCard: true })}
          />
        ))}

        {/* ── Delil Kartları (admin panelden eklenen) ── */}
        {evidences.map((ev) => {
          const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace('/api', '');
          const relChallenge = challenges.find(c => c.id === ev.challengeId);
          if (!relChallenge) return null;
          const sameChEvidences = evidences.filter(e => e.challengeId === ev.challengeId);
          const evIdx = sameChEvidences.findIndex(e => e.id === ev.id);
          const evX = relChallenge.pos.x - 80 + evIdx * 190;
          const evY = relChallenge.pos.y + 310;
          const url = ev.fileUrl?.startsWith('http') ? ev.fileUrl : BASE + ev.fileUrl;
          const rot = evIdx % 2 === 0 ? -2 : 2;

          return (
            <div
              key={`ev_${ev.id}`}
              className="db-card"
              style={{
                left: evX, top: evY,
                transform: `rotate(${rot}deg)`,
                width: 160, height: 200,
                cursor: 'pointer',
                position: 'absolute',
                zIndex: 2,
                background: '#f0ece0',
                boxShadow: '4px 6px 18px rgba(0,0,0,0.55), 8px 10px 28px rgba(0,0,0,0.35)',
                padding: '8px 8px 32px 8px',
                borderRadius: 2,
              }}
              onClick={() => setViewCard({ ...ev, isEvidenceCard: true, evUrl: url })}
            >
              {/* Kırmızı raptiye */}
              <div style={{
                position:'absolute', top:-9, left:'50%',
                transform:'translateX(-50%)',
                width:16, height:16, borderRadius:'50%',
                background:'radial-gradient(circle at 35% 30%, #ff6b6b, #cc2222 45%, #8b0000 80%)',
                boxShadow:'1px 3px 6px rgba(0,0,0,0.7)',
                zIndex:10,
              }}/>

              {/* Fotoğraf alanı — tam dolu */}
              <div style={{
                width:'100%',
                height:'100%',
                overflow:'hidden',
                background:'#111',
                borderRadius:1,
                position:'relative',
              }}>
                {/* Tür etiketi — kartın üstünü komple kapat */}
                <div style={{
                  position:'absolute', top:0, left:0, right:0, zIndex:5,
                  background:'rgba(0,0,0,0.88)',
                  color:'#fff', fontSize:13, fontWeight:900,
                  padding:'8px 10px', letterSpacing:2,
                  fontFamily:'"Courier New", Courier, monospace',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                }}>
                  {ev.type === 'video'    && <><span style={{fontSize:18}}>🎥</span> VİDEO</>}
                  {ev.type === 'image'    && <><span style={{fontSize:18}}>🖼️</span> FOTOĞRAF</>}
                  {ev.type === 'audio'    && <><span style={{fontSize:18}}>🎵</span> SES KAYDI</>}
                  {ev.type === 'document' && <><span style={{fontSize:18}}>📄</span> BELGE</>}
                  {!['video','image','audio','document'].includes(ev.type) && <><span style={{fontSize:18}}>📁</span> DOSYA</>}
                </div>
                {ev.type === 'image' && (
                  <img src={url} alt={ev.title}
                    style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                )}
                {ev.type === 'video' && (
                  <video src={url} muted
                    style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                )}
                {ev.type === 'audio' && (
                  <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#1a0a2e',gap:8}}>
                    <span style={{fontSize:40}}>🎵</span>
                    <span style={{fontFamily:'"Courier New",monospace',fontSize:9,color:'#c084fc'}}>SES KAYDI</span>
                  </div>
                )}
                {!['image','video','audio'].includes(ev.type) && (
                  <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#1a1208',gap:8}}>
                    <span style={{fontSize:40}}>{ev.type==='document'?'📄':'📁'}</span>
                    <span style={{fontFamily:'"Courier New",monospace',fontSize:9,color:'#c9975a',textTransform:'uppercase'}}>{ev.type}</span>
                  </div>
                )}
              </div>

              {/* Alt beyaz şerit — başlık */}
              <div style={{
                position:'absolute', bottom:0, left:0, right:0,
                height:32, background:'#f0ece0',
                display:'flex', alignItems:'center', justifyContent:'center',
                borderTop:'1px solid rgba(0,0,0,0.08)',
                zIndex:4,
              }}>
                <span style={{
                  fontFamily:'"Courier New", Courier, monospace',
                  fontSize:9, fontWeight:900,
                  color:'#2a1a08', textAlign:'center',
                  padding:'0 6px', lineHeight:1.2,
                  overflow:'hidden', textOverflow:'ellipsis',
                  whiteSpace:'nowrap', maxWidth:'100%',
                }}>{ev.title}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Açık Soru Paneli (sağ kenar) ── */}
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

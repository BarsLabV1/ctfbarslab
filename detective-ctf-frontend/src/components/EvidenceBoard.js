import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import CrimeSceneReport from './CrimeSceneReport';
import './DetectiveBoard.css';

const HUB_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api')
  .replace('/api', '/hubs/board');

const NOTE_COLORS    = ['#fef9e7','#e8f5e9','#fff3e0','#fce4ec','#e3f2fd','#f3e5f5','#bacb9a'];
const NOTE_ROTATIONS = [-3, 2, -2, 3, -1, 1, -1.5];

let nextId = Date.now();
const uid  = () => String(++nextId);

const getStringPath = (from, to) => {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
};

const EvidenceBoard = ({ caseId, caseData, clues = [], autoItems = [], onUnlock, processedIds }) => {
  const boardRef  = useRef(null);
  const hubRef    = useRef(null);
  const isSyncing = useRef(false);
  const localProcessedIds = useRef(new Set());
  const processedAutoIds  = processedIds || localProcessedIds;
  const initialNotesAdded = useRef(false);

  const btnStyle = {
    background:'rgba(0,0,0,0.15)', border:'none', borderRadius:4,
    cursor:'pointer', fontSize:12, padding:'2px 5px', color:'#333',
  };

  const [pan,   setPan]   = useState({ x: 50, y: 80 });
  const [scale, setScale] = useState(0.85);
  const isPanning = useRef(false);
  const panStart  = useRef({ x: 0, y: 0 });

  const [connected,       setConnected]       = useState(false);
  const [notes,           setNotes]           = useState(() =>
    clues.map((c, i) => ({
      id: String(c.id), x: 200 + (i%4)*260, y: 200 + Math.floor(i/4)*220,
      title: c.title || 'İpucu', text: c.content || c.description || '',
      color: NOTE_COLORS[i % NOTE_COLORS.length],
      rotation: NOTE_ROTATIONS[i % NOTE_ROTATIONS.length],
    }))
  );
  const [strings,         setStrings]         = useState([]);
  const [suspects,        setSuspects]        = useState([]);
  const [viewReport,      setViewReport]      = useState(false);
  const [showAddNote,     setShowAddNote]     = useState(false);
  const [showAddSuspect,  setShowAddSuspect]  = useState(false);
  const [newNote,         setNewNote]         = useState({ title:'', text:'' });
  const [newSuspect,      setNewSuspect]      = useState({ name:'', role:'', motive:'' });
  const [viewCard,        setViewCard]        = useState(null);
  const [connecting,      setConnecting]      = useState(null);

  /* always-current refs for use in callbacks */
  const notesRef   = useRef(notes);
  const stringsRef = useRef(strings);
  const suspectsRef= useRef(suspects);
  useEffect(() => { notesRef.current   = notes;   }, [notes]);
  useEffect(() => { stringsRef.current = strings; }, [strings]);
  useEffect(() => { suspectsRef.current= suspects;}, [suspects]);

  const dragging   = useRef(null);
  const wasDragged = useRef(false);

  /* ── broadcast ── */
  const broadcast = useCallback((n, st, su) => {
    if (isSyncing.current || !hubRef.current || !caseId) return;
    hubRef.current.invoke('UpdateBoard', caseId, JSON.stringify({ notes: n, strings: st, suspects: su })).catch(() => {});
  }, [caseId]);

  /* ── Auto items ── */
  useEffect(() => {
    if (!autoItems || autoItems.length === 0) return;
    const lastItem = autoItems[autoItems.length - 1];
    if (processedAutoIds.current.has(lastItem.id)) return;
    processedAutoIds.current.add(lastItem.id);
    if (lastItem.type === 'note') {
      const i = notesRef.current.length % NOTE_COLORS.length;
      const n = { id: uid(), _auto: true, x: 300+Math.random()*400, y: 200+Math.random()*300,
        title: lastItem.title||'Yeni Bulgu', text: lastItem.text||'',
        color: NOTE_COLORS[i], rotation: NOTE_ROTATIONS[i] };
      setNotes(prev => { const u=[...prev,n]; broadcast(u,stringsRef.current,suspectsRef.current); return u; });
    } else if (lastItem.type === 'suspect') {
      const s = { id: uid(), _auto: true, x: 600+Math.random()*200, y: 200+Math.random()*300,
        name: lastItem.name||'Bilinmiyor', role: lastItem.role||'', motive: lastItem.motive||'' };
      setSuspects(prev => { const u=[...prev,s]; broadcast(notesRef.current,stringsRef.current,u); return u; });
    }
  }, [autoItems]); // eslint-disable-line

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
        if (state.notes)    setNotes(prev => { const dbIds=new Set((state.notes||[]).map(n=>n.id)); return [...(state.notes||[]),...prev.filter(n=>!dbIds.has(n.id)&&n._auto)]; });
        if (state.strings)  setStrings(state.strings);
        if (state.suspects) setSuspects(prev => { const dbIds=new Set((state.suspects||[]).map(s=>s.id)); return [...(state.suspects||[]),...prev.filter(s=>!dbIds.has(s.id)&&s._auto)]; });
      } catch {}
      if (!initialNotesAdded.current && caseData) {
        initialNotesAdded.current = true;
        const startNotes = [
          { id:`init_case_${caseId}`, _auto:true, x:200, y:200, title:'📋 '+caseData.title, text:caseData.story||caseData.description||'', color:'#fef9e7', rotation:-1 },
          { id:`init_report_${caseId}`, _auto:true, x:500, y:220, title:'📄 Olay Yeri Raporu', text:`Zorluk: ${caseData.difficulty}/5\nToplam Puan: ${caseData.totalPoints}`, color:'#e3f2fd', rotation:2 },
        ];
        setNotes(prev => { const existIds=new Set(prev.map(n=>n.id)); const toAdd=startNotes.filter(n=>!existIds.has(n.id)); return toAdd.length===0?prev:[...prev,...toAdd]; });
      }
    });

    hub.on('BoardUpdated', (json) => {
      isSyncing.current = true;
      try { const s=JSON.parse(json); if(s.notes) setNotes(s.notes); if(s.strings) setStrings(s.strings); if(s.suspects) setSuspects(s.suspects); } catch {}
      setTimeout(() => { isSyncing.current=false; }, 50);
    });

    hub.on('ChallengeUnlocked', (json) => { try { const c=JSON.parse(json); if(onUnlock) onUnlock(c); } catch {} });
    hub.start().then(() => { hub.invoke('JoinBoard', caseId); setConnected(true); }).catch(e => console.warn('SignalR:',e));
    hubRef.current = hub;
    return () => hub.stop();
  }, [caseId]); // eslint-disable-line

  /* ── Drag ── */
  const startDrag = useCallback((e, id, type) => {
    e.preventDefault(); e.stopPropagation();
    const vp = boardRef.current?.getBoundingClientRect();
    if (!vp) return;
    const bx = (e.clientX - vp.left - pan.x) / scale;
    const by = (e.clientY - vp.top  - pan.y) / scale;
    const arr = type === 'note' ? notesRef.current : suspectsRef.current;
    const item = arr.find(x => x.id === id);
    if (!item) return;
    dragging.current = { id, type, ox: bx - item.x, oy: by - item.y };
    wasDragged.current = false;
  }, [pan, scale]);

  const onMouseMove = useCallback((e) => {
    if (dragging.current) {
      const vp = boardRef.current?.getBoundingClientRect();
      if (!vp) return;
      const bx = (e.clientX - vp.left - pan.x) / scale;
      const by = (e.clientY - vp.top  - pan.y) / scale;
      const nx = bx - dragging.current.ox;
      const ny = by - dragging.current.oy;
      wasDragged.current = true;
      if (dragging.current.type === 'note')
        setNotes(ns => ns.map(n => n.id === dragging.current?.id ? {...n,x:nx,y:ny} : n));
      else
        setSuspects(ss => ss.map(s => s.id === dragging.current?.id ? {...s,x:nx,y:ny} : s));
      return;
    }
    if (!isPanning.current) return;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  }, [pan, scale]);

  const onMouseUp = useCallback(() => {
    if (dragging.current) {
      dragging.current = null;
      // refs her zaman güncel — güvenli broadcast
      broadcast(notesRef.current, stringsRef.current, suspectsRef.current);
    }
    isPanning.current = false;
  }, [broadcast]);

  const onBoardMouseDown = (e) => {
    if (e.target.closest('.db-card') || e.target.closest('.eb-toolbar-new')) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  /* ── Wheel ── */
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const vp = boardRef.current.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) {
      const xs = (e.clientX - vp.left - pan.x) / scale;
      const ys = (e.clientY - vp.top  - pan.y) / scale;
      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      const ns = Math.min(Math.max(0.3, scale * delta), 2.0);
      setPan({ x: e.clientX - vp.left - xs * ns, y: e.clientY - vp.top - ys * ns });
      setScale(ns);
    } else {
      setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  }, [pan, scale]);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  /* ── Connect ── */
  const handleItemClick = useCallback((id) => {
    if (wasDragged.current) { wasDragged.current = false; return; }
    if (connecting === null) {
      setConnecting(id);
    } else if (connecting !== id) {
      const cur = stringsRef.current;
      const exists = cur.some(s => (s.fromId===connecting&&s.toId===id)||(s.fromId===id&&s.toId===connecting));
      if (!exists) {
        const ns = [...cur, { id: uid(), fromId: connecting, toId: id }];
        setStrings(ns);
        broadcast(notesRef.current, ns, suspectsRef.current);
      }
      setConnecting(null);
    } else { setConnecting(null); }
  }, [connecting, broadcast]);

  const removeString = useCallback((id) => {
    const ns = stringsRef.current.filter(s => s.id !== id);
    setStrings(ns);
    broadcast(notesRef.current, ns, suspectsRef.current);
  }, [broadcast]);

  /* ── Note CRUD ── */
  const addNote = () => {
    if (!newNote.title.trim()) return;
    const i = notesRef.current.length % NOTE_COLORS.length;
    const n = { id: uid(), x: 300+Math.random()*500, y: 200+Math.random()*400,
      title: newNote.title, text: newNote.text,
      color: NOTE_COLORS[i], rotation: NOTE_ROTATIONS[i] };
    const u = [...notesRef.current, n];
    setNotes(u);
    broadcast(u, stringsRef.current, suspectsRef.current);
    setNewNote({ title:'', text:'' }); setShowAddNote(false);
  };

  const removeNote = useCallback((id) => {
    const nn = notesRef.current.filter(n => n.id !== id);
    const ns = stringsRef.current.filter(s => s.fromId !== id && s.toId !== id);
    setNotes(nn); setStrings(ns);
    broadcast(nn, ns, suspectsRef.current);
  }, [broadcast]);

  /* ── Suspect CRUD ── */
  const addSuspect = () => {
    if (!newSuspect.name.trim()) return;
    const s = { id: uid(), x: 600+Math.random()*300, y: 200+Math.random()*400, ...newSuspect };
    const u = [...suspectsRef.current, s];
    setSuspects(u);
    broadcast(notesRef.current, stringsRef.current, u);
    setNewSuspect({ name:'', role:'', motive:'' }); setShowAddSuspect(false);
  };

  const removeSuspect = useCallback((id) => {
    const ns2 = suspectsRef.current.filter(s => s.id !== id);
    const ns  = stringsRef.current.filter(s => s.fromId !== id && s.toId !== id);
    setSuspects(ns2); setStrings(ns);
    broadcast(notesRef.current, ns, ns2);
  }, [broadcast]);

  /* ── Center for strings ── */
  const getCenter = useCallback((id) => {
    const n = notesRef.current.find(n => n.id === id);
    if (n) return { x: n.x + 95, y: n.y - 2 };
    const s = suspectsRef.current.find(s => s.id === id);
    if (s) return { x: s.x + 80, y: s.y - 2 };
    return null;
  }, []);

  /* ══════════════════════════════════════════ RENDER ══════════════════════════════════════════ */
  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden' }}>

      {/* ── Toolbar ── */}
      <div className="eb-toolbar-new" style={{
        display:'flex', alignItems:'center', gap:10,
        padding:'8px 14px', background:'#0f0c06',
        borderBottom:'1px solid rgba(201,151,90,0.2)',
        flexShrink:0, flexWrap:'wrap', zIndex:300,
      }}>
        <span style={{ fontFamily:'"Courier New",monospace', fontSize:13, fontWeight:900, color:'#c9975a', letterSpacing:1 }}>
          📌 DELİL PANOSU
        </span>
        <span style={{ width:1, height:20, background:'rgba(201,151,90,0.2)' }}/>
        <span style={{ fontSize:10, color: connected ? '#80c050' : '#888', fontFamily:'monospace' }}>
          {connected ? '● Canlı' : '○ Bağlanıyor...'}
        </span>
        <button className="btn btn-primary btn-small" onClick={() => setShowAddNote(true)}>+ Not</button>
        <button className="btn btn-secondary btn-small" onClick={() => setShowAddSuspect(true)}>+ Şüpheli</button>
        {connecting !== null && (
          <span style={{ fontSize:11, color:'#e74c3c', fontFamily:'monospace', background:'rgba(192,57,43,0.15)', padding:'4px 10px', borderRadius:4 }}>
            🔗 Başka öğeye tıkla
            <button onClick={() => setConnecting(null)} style={{ marginLeft:8, background:'none', border:'none', color:'#e74c3c', cursor:'pointer', fontSize:12 }}>İptal</button>
          </span>
        )}
        {caseData && (
          <button className="adm-tool-btn" onClick={() => setViewReport(true)} style={{ borderColor:'rgba(201,151,90,0.5)', color:'#c9975a' }}>
            📄 Olay Yeri Raporu
          </button>
        )}
        <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center' }}>
          <button className="adm-tool-btn" onClick={() => setScale(s => Math.min(2, s*1.1))}>+</button>
          <span style={{ fontFamily:'monospace', fontSize:10, color:'#c9975a', padding:'4px 8px', minWidth:40, textAlign:'center' }}>{Math.round(scale*100)}%</span>
          <button className="adm-tool-btn" onClick={() => setScale(s => Math.max(0.3, s*0.9))}>−</button>
          <button className="adm-tool-btn" onClick={() => { setPan({x:50,y:80}); setScale(0.85); }}>⌂</button>
        </div>
      </div>

      {/* ── Cork Board ── */}
      <div
        ref={boardRef}
        className="db-viewport"
        style={{ flex:1, height:'auto', minHeight:0 }}
        onMouseDown={onBoardMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div className="db-board" style={{
          transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          backgroundImage: `url(${process.env.PUBLIC_URL}/pano-cercevesiz.png)`,
          backgroundSize: '1024px 576px',
          backgroundRepeat: 'repeat',
        }}>

          {/* SVG İpler */}
          <svg className="db-svg" style={{ overflow:'visible' }}>
            {strings.map(s => {
              const from = getCenter(s.fromId);
              const to   = getCenter(s.toId);
              if (!from || !to) return null;
              const mid = { x:(from.x+to.x)/2, y:(from.y+to.y)/2-20 };
              return (
                <g key={s.id}>
                  <path d={getStringPath(from,to)} stroke="#c0392b" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.9}/>
                  <circle cx={mid.x} cy={mid.y} r={8} fill="#c0392b" opacity={0.75} style={{ pointerEvents:'all', cursor:'pointer' }} onClick={() => removeString(s.id)}/>
                  <text x={mid.x} y={mid.y+4} textAnchor="middle" fontSize={9} fill="white" style={{ pointerEvents:'none', userSelect:'none' }}>✕</text>
                </g>
              );
            })}
          </svg>

          {/* Senaryo Kartı */}
          {caseData && (
            <div className="db-card db-scenario-card" style={{ left:120, top:180, transform:'rotate(-1.5deg)', position:'absolute', zIndex:2 }}>
              <div className="db-pin db-pin-red"/>
              <div className="db-card-stamp">GİZLİ</div>
              <div style={{ fontFamily:'Courier New', fontSize:8, color:'rgba(0,0,0,0.4)', marginBottom:6, letterSpacing:1 }}>DOSYA #{String(caseData.id||1).padStart(4,'0')}</div>
              <div className="db-scenario-title">{caseData.title}</div>
              <div className="db-scenario-desc">{(caseData.story||caseData.description||'').slice(0,100)}...</div>
              <div className="db-scenario-meta"><span>⭐ {caseData.totalPoints}</span></div>
              <button className="db-report-btn" onClick={() => setViewReport(true)}>📄 Olay Yeri Raporu</button>
            </div>
          )}

          {/* Not Kartları */}
          {notes.map(n => (
            <div key={n.id} className="db-card db-user-note"
              style={{
                left:n.x, top:n.y, transform:`rotate(${n.rotation||0}deg)`,
                background: n.color||'#fef9e7',
                cursor: connecting !== null ? 'crosshair' : 'grab',
                outline: connecting === n.id ? '3px solid #f5c518' : undefined,
                zIndex: connecting === n.id ? 20 : 3,
                minWidth:180, minHeight:160, padding:'28px 16px 36px',
              }}
              onMouseDown={e => startDrag(e, n.id, 'note')}
              onClick={() => handleItemClick(n.id)}
            >
              <div className="db-pin"/>
              <div className="db-note-title">{n.title}</div>
              <div className="db-note-text">{n.text}</div>
              <div style={{ position:'absolute', bottom:6, right:8, display:'flex', gap:4 }}>
                <button style={btnStyle} onClick={e=>{e.stopPropagation();setViewCard(n);}}>👁️</button>
                <button style={btnStyle} onClick={e=>{e.stopPropagation();removeNote(n.id);}}>🗑</button>
              </div>
            </div>
          ))}

          {/* Şüpheli Kartları */}
          {suspects.map(s => (
            <div key={s.id} className="db-card db-suspect-card"
              style={{
                left:s.x, top:s.y, transform:'rotate(-1.5deg)',
                cursor: connecting !== null ? 'crosshair' : 'grab',
                outline: connecting === s.id ? '3px solid #f5c518' : undefined,
                zIndex: connecting === s.id ? 20 : 3,
              }}
              onMouseDown={e => startDrag(e, s.id, 'suspect')}
              onClick={() => handleItemClick(s.id)}
            >
              <div className="db-pin db-pin-red"/>
              <div className="db-suspect-avatar">{s.name.charAt(0).toUpperCase()}</div>
              <div className="db-suspect-name">{s.name}</div>
              {s.role   && <div className="db-suspect-role">{s.role}</div>}
              {s.motive && <div className="db-suspect-motive">⚠️ {s.motive}</div>}
              <div style={{ position:'absolute', bottom:6, right:8, display:'flex', gap:4 }}>
                <button style={btnStyle} onClick={e=>{e.stopPropagation();setViewCard({...s,_isSuspect:true});}}>��️</button>
                <button style={btnStyle} onClick={e=>{e.stopPropagation();removeSuspect(s.id);}}>🗑</button>
              </div>
            </div>
          ))}

          {notes.length===0 && suspects.length===0 && (
            <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', fontFamily:'"Courier New",monospace', fontSize:14, color:'rgba(255,255,255,0.2)', pointerEvents:'none', textAlign:'center' }}>
              + Not veya Şüpheli ekle, aralarına ip çek
            </div>
          )}
        </div>
      </div>

      {/* Not Ekleme */}
      {showAddNote && (
        <div className="db-modal-overlay" onClick={() => setShowAddNote(false)}>
          <div className="db-modal" onClick={e=>e.stopPropagation()}>
            <h3>Yeni Not</h3>
            <input placeholder="Başlık *" value={newNote.title} onChange={e=>setNewNote(n=>({...n,title:e.target.value}))}/>
            <textarea placeholder="İçerik" rows={4} value={newNote.text} onChange={e=>setNewNote(n=>({...n,text:e.target.value}))}/>
            <div className="db-modal-actions">
              <button className="db-modal-btn-ok" onClick={addNote}>Ekle</button>
              <button className="db-modal-btn-cancel" onClick={()=>setShowAddNote(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Şüpheli Ekleme */}
      {showAddSuspect && (
        <div className="db-modal-overlay" onClick={() => setShowAddSuspect(false)}>
          <div className="db-modal" onClick={e=>e.stopPropagation()}>
            <h3>Şüpheli Ekle</h3>
            <input placeholder="Ad Soyad *" value={newSuspect.name} onChange={e=>setNewSuspect(s=>({...s,name:e.target.value}))}/>
            <input placeholder="Rol / Meslek" value={newSuspect.role} onChange={e=>setNewSuspect(s=>({...s,role:e.target.value}))}/>
            <input placeholder="Motif" value={newSuspect.motive} onChange={e=>setNewSuspect(s=>({...s,motive:e.target.value}))}/>
            <div className="db-modal-actions">
              <button className="db-modal-btn-ok" onClick={addSuspect}>Ekle</button>
              <button className="db-modal-btn-cancel" onClick={()=>setShowAddSuspect(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Kart Görüntüleme */}
      {viewCard && (
        <div className="db-modal-overlay" onClick={() => setViewCard(null)}>
          <div className="db-card-popup" onClick={e=>e.stopPropagation()}>
            <div className="db-card-popup-paper" style={{ background: viewCard._isSuspect ? '#f0ece0' : (viewCard.color||'#fef9e7') }}>
              <div className="db-card-popup-pin"/>
              <button className="db-panel-close" onClick={() => setViewCard(null)}>✕</button>
              <div className="db-card-popup-title">{viewCard._isSuspect ? viewCard.name : viewCard.title}</div>
              <div className="db-card-popup-divider"/>
              {viewCard._isSuspect ? (
                <div>
                  {viewCard.role   && <p className="db-card-popup-desc"><strong>Rol:</strong> {viewCard.role}</p>}
                  {viewCard.motive && <p className="db-card-popup-desc"><strong>Motif:</strong> {viewCard.motive}</p>}
                </div>
              ) : (
                <p className="db-card-popup-desc" style={{ whiteSpace:'pre-line' }}>{viewCard.text}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Olay Yeri Raporu */}
      {viewReport && caseData && (
        <div className="db-modal-overlay db-report-overlay" onClick={() => setViewReport(false)}>
          <div className="db-report-popup" onClick={e=>e.stopPropagation()}>
            <button className="db-report-close" onClick={() => setViewReport(false)}>✕ Kapat</button>
            <CrimeSceneReport caseData={caseData} unlockedSections={[]} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceBoard;

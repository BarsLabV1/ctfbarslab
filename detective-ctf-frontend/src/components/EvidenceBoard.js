import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import './EvidenceBoard.css';

const NOTE_COLORS    = ['#fef9e7','#e8f5e9','#fff3e0','#fce4ec','#e3f2fd','#f3e5f5'];
const NOTE_ROTATIONS = [-3, 2, -2, 3, -1, 1];
const HUB_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api')
  .replace('/api', '/hubs/board');

let nextId = Date.now();
const uid  = () => String(++nextId);

/* ══════════════════════════════════════════ */
const EvidenceBoard = ({ caseId, clues = [] }) => {
  const boardRef   = useRef(null);
  const hubRef     = useRef(null);
  const isSyncing  = useRef(false); // prevent echo loop

  const [connected, setConnected] = useState(false);
  const [notes,     setNotes]     = useState(() =>
    clues.map((c, i) => ({
      id: String(c.id), x: 60 + (i%4)*220, y: 60 + Math.floor(i/4)*200,
      title: c.title || 'İpucu', text: c.content || c.description || '',
      color: NOTE_COLORS[i % NOTE_COLORS.length],
      rotation: NOTE_ROTATIONS[i % NOTE_ROTATIONS.length],
    }))
  );
  const [strings,  setStrings]  = useState([]);
  const [suspects, setSuspects] = useState([]);

  const [dragging,        setDragging]        = useState(null);
  const [connecting,      setConnecting]      = useState(null);
  const [editNote,        setEditNote]        = useState(null);
  const [editSuspect,     setEditSuspect]     = useState(null);
  const [showAddNote,     setShowAddNote]     = useState(false);
  const [showAddSuspect,  setShowAddSuspect]  = useState(false);
  const [newNote,         setNewNote]         = useState({ title:'', text:'' });
  const [newSuspect,      setNewSuspect]      = useState({ name:'', role:'', motive:'' });

  /* ── SignalR connect ── */
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
        if (state.notes)    setNotes(state.notes);
        if (state.strings)  setStrings(state.strings);
        if (state.suspects) setSuspects(state.suspects);
      } catch {}
    });

    hub.on('BoardUpdated', (json) => {
      isSyncing.current = true;
      try {
        const state = JSON.parse(json);
        if (state.notes)    setNotes(state.notes);
        if (state.strings)  setStrings(state.strings);
        if (state.suspects) setSuspects(state.suspects);
      } catch {}
      setTimeout(() => { isSyncing.current = false; }, 50);
    });

    hub.start()
      .then(() => { hub.invoke('JoinBoard', caseId); setConnected(true); })
      .catch(e => console.warn('SignalR bağlantı hatası:', e));

    hubRef.current = hub;
    return () => { hub.stop(); };
  }, [caseId]);

  /* ── broadcast helper ── */
  const broadcast = useCallback((n, st, su) => {
    if (isSyncing.current || !hubRef.current || !caseId) return;
    const json = JSON.stringify({ notes: n, strings: st, suspects: su });
    hubRef.current.invoke('UpdateBoard', caseId, json).catch(() => {});
  }, [caseId]);

  /* ── drag ── */
  const startDrag = useCallback((e, id, type) => {
    e.preventDefault();
    const board = boardRef.current.getBoundingClientRect();
    const item  = type === 'note'
      ? notes.find(n => n.id === id)
      : suspects.find(s => s.id === id);
    if (!item) return;
    setDragging({ id, type, ox: e.clientX - board.left - item.x, oy: e.clientY - board.top - item.y });
  }, [notes, suspects]);

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    const board = boardRef.current.getBoundingClientRect();
    const x = e.clientX - board.left - dragging.ox;
    const y = e.clientY - board.top  - dragging.oy;
    if (dragging.type === 'note') {
      setNotes(ns => { const u = ns.map(n => n.id === dragging.id ? {...n,x,y} : n); return u; });
    } else {
      setSuspects(ss => { const u = ss.map(s => s.id === dragging.id ? {...s,x,y} : s); return u; });
    }
  }, [dragging]);

  const stopDrag = useCallback(() => {
    if (!dragging) return;
    setDragging(null);
    // broadcast after drag ends
    setNotes(n => { setStrings(st => { setSuspects(su => { broadcast(n,st,su); return su; }); return st; }); return n; });
  }, [dragging, broadcast]);

  /* ── connect notes ── */
  const handleItemClick = (e, id) => {
    if (dragging) return;
    if (connecting === null) {
      setConnecting(id);
    } else if (connecting !== id) {
      const exists = strings.some(s =>
        (s.fromId===connecting && s.toId===id) || (s.fromId===id && s.toId===connecting));
      if (!exists) {
        const newStrings = [...strings, { id: uid(), fromId: connecting, toId: id }];
        setStrings(newStrings);
        setNotes(n => { setSuspects(su => { broadcast(n, newStrings, su); return su; }); return n; });
      }
      setConnecting(null);
    } else {
      setConnecting(null);
    }
  };

  const removeString = (id) => {
    const newStrings = strings.filter(s => s.id !== id);
    setStrings(newStrings);
    broadcast(notes, newStrings, suspects);
  };

  /* ── add / remove note ── */
  const addNote = () => {
    if (!newNote.title.trim()) return;
    const i = notes.length % NOTE_COLORS.length;
    const n = {
      id: uid(), x: 80+Math.random()*300, y: 80+Math.random()*200,
      title: newNote.title, text: newNote.text,
      color: NOTE_COLORS[i], rotation: NOTE_ROTATIONS[i],
    };
    const newNotes = [...notes, n];
    setNotes(newNotes);
    broadcast(newNotes, strings, suspects);
    setNewNote({ title:'', text:'' });
    setShowAddNote(false);
  };

  const removeNote = (id) => {
    const newNotes   = notes.filter(n => n.id !== id);
    const newStrings = strings.filter(s => s.fromId !== id && s.toId !== id);
    setNotes(newNotes); setStrings(newStrings);
    broadcast(newNotes, newStrings, suspects);
  };

  const saveEditNote = () => {
    const newNotes = notes.map(n => n.id === editNote.id ? {...n,...editNote} : n);
    setNotes(newNotes);
    broadcast(newNotes, strings, suspects);
    setEditNote(null);
  };

  /* ── add / remove suspect ── */
  const addSuspect = () => {
    if (!newSuspect.name.trim()) return;
    const s = { id: uid(), x: 500+Math.random()*200, y: 60+Math.random()*200, ...newSuspect };
    const newSuspects = [...suspects, s];
    setSuspects(newSuspects);
    broadcast(notes, strings, newSuspects);
    setNewSuspect({ name:'', role:'', motive:'' });
    setShowAddSuspect(false);
  };

  const removeSuspect = (id) => {
    const newSuspects = suspects.filter(s => s.id !== id);
    const newStrings  = strings.filter(s => s.fromId !== id && s.toId !== id);
    setSuspects(newSuspects); setStrings(newStrings);
    broadcast(notes, newStrings, newSuspects);
  };

  const saveEditSuspect = () => {
    const newSuspects = suspects.map(s => s.id === editSuspect.id ? {...s,...editSuspect} : s);
    setSuspects(newSuspects);
    broadcast(notes, strings, newSuspects);
    setEditSuspect(null);
  };

  /* ── center of item for string drawing ── */
  const center = (id) => {
    const n = notes.find(n => n.id === id) || suspects.find(s => s.id === id);
    return n ? { x: n.x+95, y: n.y+65 } : { x:0, y:0 };
  };

  /* ══════════════════════════════════════════ */
  return (
    <div className="eb-wrap">
      <div className="eb-toolbar">
        <div className="eb-toolbar-left">
          <span className="eb-toolbar-title">Dedektif Panosu</span>
          <span className={`eb-conn-dot ${connected ? 'online' : 'offline'}`}
            title={connected ? 'Bağlı — takım eş zamanlı görüyor' : 'Bağlanıyor...'} />
          <span className="eb-conn-label">{connected ? 'Canlı' : 'Bağlanıyor...'}</span>
        </div>
        <div className="eb-toolbar-actions">
          {connecting !== null && (
            <span className="eb-connecting-hint">
              Bağlamak için başka bir öğeye tıkla
              <button onClick={() => setConnecting(null)}>İptal</button>
            </span>
          )}
          <button className="eb-btn" onClick={() => setShowAddNote(true)}>+ Not</button>
          <button className="eb-btn" onClick={() => setShowAddSuspect(true)}>+ Şüpheli</button>
        </div>
      </div>

      <div ref={boardRef} className="eb-board"
        onMouseMove={onMouseMove} onMouseUp={stopDrag} onMouseLeave={stopDrag}>
        <div className="eb-cork" />

        <svg className="eb-svg">
          {strings.map(s => {
            const a = center(s.fromId), b = center(s.toId);
            const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
            return (
              <g key={s.id}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="eb-string"/>
                <circle cx={mx} cy={my} r={8} className="eb-string-del" onClick={() => removeString(s.id)}/>
                <text x={mx} y={my+4} className="eb-string-del-txt" onClick={() => removeString(s.id)}>✕</text>
              </g>
            );
          })}
        </svg>

        {notes.map(n => (
          <div key={n.id}
            className={`eb-note ${connecting===n.id?'connecting':''} ${connecting!==null&&connecting!==n.id?'connectable':''}`}
            style={{ left:n.x, top:n.y, background:n.color, transform:`rotate(${n.rotation}deg)` }}
            onMouseDown={e => startDrag(e, n.id, 'note')}
            onClick={e => handleItemClick(e, n.id)}>
            <div className="eb-pin"/>
            <div className="eb-note-title">{n.title}</div>
            <div className="eb-note-text">{n.text}</div>
            <div className="eb-note-btns">
              <button onClick={e=>{e.stopPropagation();setEditNote(n);}}>✏️</button>
              <button onClick={e=>{e.stopPropagation();removeNote(n.id);}}>🗑</button>
              <button onClick={e=>{e.stopPropagation();handleItemClick(e,n.id);}} title="İp bağla">🔗</button>
            </div>
          </div>
        ))}

        {suspects.map(s => (
          <div key={s.id}
            className={`eb-suspect ${connecting===s.id?'connecting':''} ${connecting!==null&&connecting!==s.id?'connectable':''}`}
            style={{ left:s.x, top:s.y }}
            onMouseDown={e => startDrag(e, s.id, 'suspect')}
            onClick={e => handleItemClick(e, s.id)}>
            <div className="eb-suspect-pin"/>
            <div className="eb-suspect-avatar">{s.name.charAt(0).toUpperCase()}</div>
            <div className="eb-suspect-name">{s.name}</div>
            {s.role   && <div className="eb-suspect-role">{s.role}</div>}
            {s.motive && <div className="eb-suspect-motive">Motif: {s.motive}</div>}
            <div className="eb-note-btns">
              <button onClick={e=>{e.stopPropagation();setEditSuspect(s);}}>✏️</button>
              <button onClick={e=>{e.stopPropagation();removeSuspect(s.id);}}>🗑</button>
              <button onClick={e=>{e.stopPropagation();handleItemClick(e,s.id);}} title="İp bağla">🔗</button>
            </div>
          </div>
        ))}

        {notes.length===0 && suspects.length===0 && (
          <div className="eb-empty">Panoya not veya şüpheli ekle, aralarına kırmızı ip çek</div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAddNote && (
        <div className="eb-overlay" onClick={() => setShowAddNote(false)}>
          <div className="eb-modal" onClick={e=>e.stopPropagation()}>
            <h3>Yeni Not</h3>
            <input placeholder="Başlık *" value={newNote.title} onChange={e=>setNewNote(n=>({...n,title:e.target.value}))}/>
            <textarea placeholder="İçerik" rows={4} value={newNote.text} onChange={e=>setNewNote(n=>({...n,text:e.target.value}))}/>
            <div className="eb-modal-actions">
              <button className="eb-btn-primary" onClick={addNote}>Ekle</button>
              <button className="eb-btn-sec" onClick={()=>setShowAddNote(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {editNote && (
        <div className="eb-overlay" onClick={()=>setEditNote(null)}>
          <div className="eb-modal" onClick={e=>e.stopPropagation()}>
            <h3>Notu Düzenle</h3>
            <input value={editNote.title} onChange={e=>setEditNote(n=>({...n,title:e.target.value}))}/>
            <textarea rows={4} value={editNote.text} onChange={e=>setEditNote(n=>({...n,text:e.target.value}))}/>
            <div className="eb-modal-actions">
              <button className="eb-btn-primary" onClick={saveEditNote}>Kaydet</button>
              <button className="eb-btn-sec" onClick={()=>setEditNote(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {showAddSuspect && (
        <div className="eb-overlay" onClick={()=>setShowAddSuspect(false)}>
          <div className="eb-modal" onClick={e=>e.stopPropagation()}>
            <h3>Şüpheli Ekle</h3>
            <input placeholder="Ad Soyad *" value={newSuspect.name} onChange={e=>setNewSuspect(s=>({...s,name:e.target.value}))}/>
            <input placeholder="Rol / Meslek" value={newSuspect.role} onChange={e=>setNewSuspect(s=>({...s,role:e.target.value}))}/>
            <input placeholder="Motif" value={newSuspect.motive} onChange={e=>setNewSuspect(s=>({...s,motive:e.target.value}))}/>
            <div className="eb-modal-actions">
              <button className="eb-btn-primary" onClick={addSuspect}>Ekle</button>
              <button className="eb-btn-sec" onClick={()=>setShowAddSuspect(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {editSuspect && (
        <div className="eb-overlay" onClick={()=>setEditSuspect(null)}>
          <div className="eb-modal" onClick={e=>e.stopPropagation()}>
            <h3>Şüpheliyi Düzenle</h3>
            <input value={editSuspect.name} onChange={e=>setEditSuspect(s=>({...s,name:e.target.value}))}/>
            <input value={editSuspect.role} onChange={e=>setEditSuspect(s=>({...s,role:e.target.value}))}/>
            <input value={editSuspect.motive} onChange={e=>setEditSuspect(s=>({...s,motive:e.target.value}))}/>
            <div className="eb-modal-actions">
              <button className="eb-btn-primary" onClick={saveEditSuspect}>Kaydet</button>
              <button className="eb-btn-sec" onClick={()=>setEditSuspect(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceBoard;

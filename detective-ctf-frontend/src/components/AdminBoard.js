import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import CrimeSceneReport from './CrimeSceneReport';
import './DetectiveBoard.css';

const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace('/api', '');

const CATEGORIES = ['OSINT', 'Web', 'Forensics', 'Crypto', 'Reverse', 'PWN', 'Network', 'Final', 'SSH'];
const CATEGORY_ICONS = {
  OSINT: '🔍', Web: '🌐', Forensics: '🔬', Crypto: '🔐',
  Reverse: '⚙️', PWN: '💣', Network: '📡', Final: '🎯', SSH: '🖥️',
};
const CATEGORY_COLORS = {
  OSINT:'#1a2a1a', Web:'#0d1a2e', Forensics:'#2a1a1a', Crypto:'#1a1a2e',
  Reverse:'#1a2a1a', PWN:'#2a1a0d', Network:'#0d2a2a', Final:'#2a2a0d', SSH:'#1a2a0d',
};

const defaultQPos = (index) => ({
  x: 400 + (index % 4) * 260,
  y: 200 + Math.floor(index / 4) * 320,
});

const getStringPath = (from, to) => {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
};

const cardCenter = (pos) => ({ x: pos.x + 95, y: pos.y - 2 });

/* ─── FileDropzone ─── */
const FileDropzone = ({ fileUrl, type, uploading, onFile, onClear }) => {
  const accept = type === 'photo' ? 'image/*' : type === 'video' ? 'video/*' : type === 'audio' ? 'audio/*' : '*';
  const icon   = type === 'photo' ? '🖼️' : type === 'video' ? '🎥' : type === 'audio' ? '🎵' : '📄';
  if (uploading) return <div className="adm-ev-uploading">Yükleniyor...</div>;
  if (fileUrl) {
    return (
      <div className="adm-ev-preview">
        {type === 'photo'    && <img   src={BASE + fileUrl} alt=""   className="adm-ev-media" />}
        {type === 'video'    && <video src={BASE + fileUrl} controls className="adm-ev-media" />}
        {type === 'audio'    && <audio src={BASE + fileUrl} controls className="adm-ev-audio" />}
        {type === 'document' && <div className="adm-ev-file-icon">📄<span>{fileUrl.split('/').pop()}</span></div>}
        <button className="adm-ev-clear" onClick={onClear}>✕ Kaldır</button>
      </div>
    );
  }
  return (
    <label className="adm-ev-drop-label"
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}>
      <input type="file" accept={accept} style={{ display: 'none' }} onChange={e => onFile(e.target.files[0])} />
      <div className="adm-ev-drop-icon">{icon}</div>
      <div>Dosyayı sürükle veya <span>seç</span></div>
    </label>
  );
};

/* ─── QuestionModal ─── */
const QuestionModal = ({ title, form, setForm, cases, questions, selCase, uploading, onFile, onSave, onClose }) => (
  <div className="adm-overlay" onClick={onClose}>
    <div className="adm-modal" style={{ width: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
      <div className="adm-modal-header"><h3>{title}</h3><button className="adm-modal-close" onClick={onClose}>✕</button></div>
      <div className="adm-modal-body">
        <div className="adm-form">
          <div className="adm-form-row">
            <div>
              <label>Senaryo *</label>
              <select value={form.caseId || selCase} onChange={e => setForm(f => ({ ...f, caseId: e.target.value }))}>
                <option value="">Seç</option>
                {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label>Sıra *</label>
              <input type="number" min={1} value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} />
            </div>
          </div>
          <label>Başlık *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Soru başlığı" />
          <label>Açıklama</label>
          <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Soru açıklaması" />

          <div className="adm-section-divider">🖼️ Kart Fotoğrafı (opsiyonel)</div>
          <div className="adm-ev-dropzone">
            <FileDropzone
              fileUrl={form.imageUrl}
              type="photo"
              uploading={uploading}
              onFile={onFile}
              onClear={() => setForm(f => ({ ...f, imageUrl: '' }))}
            />
          </div>

          <div className="adm-form-row">
            <div>
              <label>Kategori *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>)}
              </select>
            </div>
            <div>
              <label>Puan *</label>
              <input type="number" min={0} value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} />
            </div>
          </div>
          <label>Flag</label>
          <input className="adm-flag-input" value={form.flag} onChange={e => setForm(f => ({ ...f, flag: e.target.value }))} placeholder="CTF{...}" />
          <label>Gerekli Soru (Kilit)</label>
          <select value={form.requiredChallengeId || ''} onChange={e => setForm(f => ({ ...f, requiredChallengeId: e.target.value }))}>
            <option value="">Baştan açık</option>
            {questions.filter(q => String(q.caseId) === String(form.caseId || selCase)).map(q => (
              <option key={q.id} value={q.id}>#{q.order} {q.title}</option>
            ))}
          </select>
          <div className="adm-section-divider">🖥️ VM Ayarları</div>
          <label className="adm-checkbox-label">
            <input type="checkbox" checked={!!form.hasVM} onChange={e => setForm(f => ({ ...f, hasVM: e.target.checked }))} />
            Bu soru için VM gerekli
          </label>
          {form.hasVM && (
            <>
              <label>Docker Image</label>
              <input value={form.dockerImage || ''} onChange={e => setForm(f => ({ ...f, dockerImage: e.target.value }))} placeholder="ctf/image:latest" />
            </>
          )}
          <div className="adm-form-actions">
            <button className="btn btn-primary" onClick={onSave}>Kaydet</button>
            <button className="btn btn-secondary" onClick={onClose}>İptal</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ─── BoardCardModal ─── */
const BoardCardModal = ({ title, form, setForm, cases, questions, selCase, uploading, onFile, onSave, onClose }) => (
  <div className="adm-overlay" onClick={onClose}>
    <div className="adm-modal" style={{ width: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
      <div className="adm-modal-header"><h3>{title}</h3><button className="adm-modal-close" onClick={onClose}>✕</button></div>
      <div className="adm-modal-body">
        <div className="adm-form">
          <div className="adm-form-row">
            <div>
              <label>Tip *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="note">📝 Not</option>
                <option value="photo">🖼️ Fotoğraf</option>
                <option value="video">🎥 Video</option>
                <option value="audio">🎵 Ses</option>
                <option value="document">📄 Belge</option>
                <option value="website">🌐 Web Sitesi</option>
                <option value="terminal">💻 Terminal</option>
              </select>
            </div>
            {form.type === 'note' && (
              <div>
                <label>Renk</label>
                <input type="color" value={form.color || '#bacb9a'} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ height: 38, padding: 4 }} />
              </div>
            )}
          </div>
          <label>Başlık *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Kart başlığı" />
          {['note', 'document'].includes(form.type) && (
            <>
              <label>İçerik</label>
              <textarea rows={3} value={form.content || ''} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Metin içeriği" />
            </>
          )}
          {['photo', 'video', 'audio', 'document'].includes(form.type) && (
            <>
              <label>Dosya Yükle</label>
              <div className="adm-ev-dropzone">
                <FileDropzone fileUrl={form.fileUrl} type={form.type} uploading={uploading} onFile={onFile} onClear={() => setForm(f => ({ ...f, fileUrl: '' }))} />
              </div>
            </>
          )}
          {form.type === 'website' && (
            <>
              <label>URL</label>
              <input value={form.externalUrl || ''} onChange={e => setForm(f => ({ ...f, externalUrl: e.target.value }))} placeholder="http://..." />
            </>
          )}
          {form.type === 'terminal' && (
            <>
              <label>Docker Image</label>
              <input value={form.dockerImage || ''} onChange={e => setForm(f => ({ ...f, dockerImage: e.target.value }))} placeholder="ctf/image:latest" />
            </>
          )}
          <div className="adm-section-divider">🔒 Kilit</div>
          <label>Hangi soru çözülünce açılsın?</label>
          <select value={form.unlockedByChallenge || ''} onChange={e => setForm(f => ({ ...f, unlockedByChallenge: e.target.value }))}>
            <option value="">Baştan açık</option>
            {questions.filter(q => String(q.caseId) === String(selCase)).map(q => (
              <option key={q.id} value={q.id}>#{q.order} {q.title}</option>
            ))}
          </select>
          <div className="adm-form-actions">
            <button className="btn btn-primary" onClick={onSave}>Kaydet</button>
            <button className="btn btn-secondary" onClick={onClose}>İptal</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   AdminBoard — main component
══════════════════════════════════════════════════════════════ */
const AdminBoard = ({ cases, questions, onQuestionsChanged }) => {
  const { showToast } = useToast();
  const boardRef = useRef(null);

  const [selCase, setSelCase] = useState('');
  const [cards,   setCards]   = useState([]);
  const [selItem, setSelItem] = useState(null);
  const [questionPositions, setQuestionPositions] = useState({});
  const [strings,    setStrings]    = useState([]);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFirst, setConnectFirst] = useState(null);
  const [addCardModal,  setAddCardModal]  = useState(false);
  const [editCardModal, setEditCardModal] = useState(null);
  const [addQModal,     setAddQModal]     = useState(false);
  const [editQModal,    setEditQModal]    = useState(null);
  const [uploading, setUploading] = useState(false);
  const [viewReport, setViewReport] = useState(false);

  const [pan,   setPan]   = useState({ x: 50, y: 80 });
  const [scale, setScale] = useState(0.85);
  const isPanning  = useRef(false);
  const panStart   = useRef({ x: 0, y: 0 });
  const dragging   = useRef(null);
  const boardMoved = useRef(false);

  const blankCard = { type: 'note', title: '', content: '', fileUrl: '', externalUrl: '', dockerImage: '', posX: 400, posY: 300, rotation: 0, color: '#bacb9a', unlockedByChallenge: '' };
  const blankQ    = { caseId: '', title: '', description: '', category: 'OSINT', order: 1, points: 100, flag: '', requiredChallengeId: '', hasVM: false, dockerImage: '', imageUrl: '' };
  const [cardForm, setCardForm] = useState(blankCard);
  const [qForm,    setQForm]    = useState(blankQ);

  const caseQuestions = questions.filter(q => String(q.caseId) === String(selCase));
  const caseData = cases.find(c => String(c.id) === String(selCase)) || null;

  /* ── Fetch board cards ── */
  const fetchCards = useCallback(async () => {
    if (!selCase) return;
    try {
      const res = await api.get('/board-cards/admin/case/' + selCase);
      const allCards = res.data;
      const stringCards = allCards.filter(c => c.type === 'string');
      const normalCards = allCards.filter(c => c.type !== 'string');
      setCards(normalCards);
      const parsedStrings = stringCards.map(c => {
        try { return { id: c.id, ...JSON.parse(c.content) }; } catch { return null; }
      }).filter(Boolean);
      setStrings(parsedStrings);
    } catch { showToast('Kartlar yüklenemedi', 'error'); }
  }, [selCase]); // eslint-disable-line

  useEffect(() => { setSelItem(null); setConnectFirst(null); fetchCards(); }, [fetchCards]);

  /* ── Init question positions ── */
  useEffect(() => {
    if (!selCase) return;
    setQuestionPositions(prev => {
      const next = { ...prev };
      caseQuestions.forEach((q, i) => {
        if (!next[q.id]) {
          next[q.id] = (q.posX || q.posY) ? { x: q.posX, y: q.posY } : defaultQPos(i);
        }
      });
      return next;
    });
  }, [selCase, questions]); // eslint-disable-line

  /* ── File upload (kart için) ── */
  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCardForm(f => ({ ...f, fileUrl: res.data.fileUrl }));
      showToast('Dosya yüklendi!', 'success');
    } catch { showToast('Yükleme başarısız', 'error'); }
    finally { setUploading(false); }
  };

  /* ── File upload (soru fotoğrafı için) ── */
  const uploadQFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setQForm(f => ({ ...f, imageUrl: res.data.fileUrl }));
      showToast('Fotoğraf yüklendi!', 'success');
    } catch { showToast('Yükleme başarısız', 'error'); }
    finally { setUploading(false); }
  };

  /* ── Save board card ── */
  const saveCard = async () => {
    if (!cardForm.title.trim()) { showToast('Başlık gerekli', 'warning'); return; }
    const body = {
      caseId: parseInt(selCase), type: cardForm.type, title: cardForm.title,
      content: cardForm.content || null, fileUrl: cardForm.fileUrl || null,
      externalUrl: cardForm.externalUrl || null, dockerImage: cardForm.dockerImage || null,
      posX: parseInt(cardForm.posX) || 400, posY: parseInt(cardForm.posY) || 300,
      rotation: parseFloat(cardForm.rotation) || 0, color: cardForm.color || null,
      unlockedByChallenge: cardForm.unlockedByChallenge ? parseInt(cardForm.unlockedByChallenge) : null,
    };
    try {
      if (editCardModal) { await api.put('/board-cards/' + editCardModal.id, body); showToast('Kart güncellendi', 'success'); setEditCardModal(null); }
      else { await api.post('/board-cards', body); showToast('Kart eklendi', 'success'); setAddCardModal(false); }
      setCardForm(blankCard); fetchCards();
    } catch (err) { showToast(err.response?.data?.message || 'Hata', 'error'); }
  };

  /* ── Delete board card ── */
  const deleteCard = async (id) => {
    try { await api.delete('/board-cards/' + id); showToast('Kart silindi', 'success'); setSelItem(null); fetchCards(); }
    catch { showToast('Silinemedi', 'error'); }
  };

  /* ── Save board card position ── */
  const saveBoardCardPosition = async (id, posX, posY) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    try {
      await api.put('/board-cards/' + id, {
        caseId: card.caseId, type: card.type, title: card.title, content: card.content,
        fileUrl: card.fileUrl, externalUrl: card.externalUrl, dockerImage: card.dockerImage,
        posX: Math.round(posX), posY: Math.round(posY), rotation: card.rotation,
        color: card.color, unlockedByChallenge: card.unlockedByChallenge,
      });
    } catch {}
  };

  /* ── Save question position ── */
  const saveQuestionPosition = useCallback(async (id, posX, posY) => {
    try {
      const res = await api.get('/challenges/' + id);
      const q = res.data;
      await api.put('/admin/challenges/' + id, {
        caseId: q.caseId || parseInt(selCase), title: q.title, description: q.description || '',
        category: q.category, order: q.order, points: q.points, flag: q.flag || '',
        requiredChallengeId: q.requiredChallengeId, hasVM: q.hasVM, dockerImage: q.dockerImage,
        posX: Math.round(posX), posY: Math.round(posY),
      });
    } catch (e) { console.error('Pozisyon kaydedilemedi', e); }
  }, [selCase]); // eslint-disable-line

  /* ── Save question (modal) ── */
  const saveQuestion = async () => {
    if (!qForm.title.trim()) { showToast('Başlık gerekli', 'warning'); return; }
    const body = {
      caseId: parseInt(qForm.caseId || selCase), title: qForm.title, description: qForm.description,
      category: qForm.category, order: parseInt(qForm.order) || 1, points: parseInt(qForm.points) || 100,
      flag: qForm.flag || '', requiredChallengeId: qForm.requiredChallengeId ? parseInt(qForm.requiredChallengeId) : null,
      hasVM: qForm.hasVM, dockerImage: qForm.dockerImage || null,
      imageUrl: qForm.imageUrl || null,
    };
    try {
      if (editQModal) { await api.put('/admin/challenges/' + editQModal.id, body); showToast('Soru güncellendi', 'success'); setEditQModal(null); }
      else { await api.post('/admin/challenges', body); showToast('Soru eklendi', 'success'); setAddQModal(false); }
      setQForm(blankQ);
      if (onQuestionsChanged) onQuestionsChanged();
    } catch (err) { showToast(err.response?.data?.message || 'Hata', 'error'); }
  };

  /* ── Delete question ── */
  const deleteQuestion = async (id) => {
    try { await api.delete('/admin/challenges/' + id); showToast('Soru silindi', 'success'); setSelItem(null); if (onQuestionsChanged) onQuestionsChanged(); }
    catch { showToast('Silinemedi', 'error'); }
  };

  /* ── Item center for string drawing ── */
  const getItemCenter = useCallback((kind, id) => {
    if (kind === 'card') {
      const c = cards.find(x => x.id === id);
      return c ? { x: c.posX + 80, y: c.posY - 2 } : null;
    } else {
      const pos = questionPositions[id] || defaultQPos(0);
      return cardCenter(pos);
    }
  }, [cards, questionPositions]);

  const getStringMid = (from, to) => ({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - 20 });

  /* ── Handle item click ── */
  const handleItemClick = useCallback((kind, id) => {
    if (connectMode) {
      if (!connectFirst) {
        setConnectFirst({ kind, id });
      } else {
        if (connectFirst.kind === kind && connectFirst.id === id) { setConnectFirst(null); return; }
        const exists = strings.some(s =>
          (s.fromKind === connectFirst.kind && s.fromId === connectFirst.id && s.toKind === kind && s.toId === id) ||
          (s.fromKind === kind && s.fromId === id && s.toKind === connectFirst.kind && s.toId === connectFirst.id)
        );
        if (!exists) {
          const saveString = async () => {
            try {
              const res = await api.post('/board-cards', {
                caseId: parseInt(selCase), type: 'string',
                title: `${connectFirst.kind}:${connectFirst.id}-${kind}:${id}`,
                content: JSON.stringify({ fromKind: connectFirst.kind, fromId: connectFirst.id, toKind: kind, toId: id }),
                posX: 0, posY: 0, rotation: 0,
              });
              setStrings(prev => [...prev, { id: res.data.id || Date.now(), fromKind: connectFirst.kind, fromId: connectFirst.id, toKind: kind, toId: id }]);
            } catch { showToast('İp kaydedilemedi', 'error'); }
          };
          saveString();
        }
        setConnectFirst(null);
      }
    } else {
      setSelItem(prev => prev && prev.kind === kind && prev.id === id ? null : { kind, id });
    }
  }, [connectMode, connectFirst, strings]); // eslint-disable-line

  /* ── Remove string ── */
  const removeString = async (id) => {
    try { await api.delete('/board-cards/' + id); } catch {}
    setStrings(prev => prev.filter(s => s.id !== id));
  };

  /* ── Pan / drag ── */
  const onBoardMouseDown = (e) => {
    if (e.target.closest('.db-card') || e.target.closest('.adm-board-toolbar')) return;
    isPanning.current = true;
    boardMoved.current = false;
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const startDragCard = useCallback((e, id) => {
    if (connectMode) return;
    e.stopPropagation();
    const vp = boardRef.current?.getBoundingClientRect();
    if (!vp) return;
    const card = cards.find(c => c.id === id);
    if (!card) return;
    const bx = (e.clientX - vp.left - pan.x) / scale;
    const by = (e.clientY - vp.top  - pan.y) / scale;
    dragging.current = { kind: 'card', id, ox: bx - card.posX, oy: by - card.posY };
    setSelItem({ kind: 'card', id });
  }, [cards, pan, scale, connectMode]);

  const startDragQuestion = useCallback((e, id) => {
    if (connectMode) return;
    e.stopPropagation();
    const vp = boardRef.current?.getBoundingClientRect();
    if (!vp) return;
    const pos = questionPositions[id] || defaultQPos(0);
    const bx = (e.clientX - vp.left - pan.x) / scale;
    const by = (e.clientY - vp.top  - pan.y) / scale;
    dragging.current = { kind: 'question', id, ox: bx - pos.x, oy: by - pos.y };
    setSelItem({ kind: 'question', id });
  }, [questionPositions, pan, scale, connectMode]);

  const onMouseMove = useCallback((e) => {
    const d = dragging.current;
    if (d) {
      const vp = boardRef.current?.getBoundingClientRect();
      if (!vp) return;
      const bx = (e.clientX - vp.left - pan.x) / scale;
      const by = (e.clientY - vp.top  - pan.y) / scale;
      const nx = bx - d.ox, ny = by - d.oy;
      if (d.kind === 'card') setCards(prev => prev.map(c => c.id === d.id ? { ...c, posX: nx, posY: ny } : c));
      else setQuestionPositions(prev => ({ ...prev, [d.id]: { x: nx, y: ny } }));
      return;
    }
    if (!isPanning.current) return;
    boardMoved.current = true;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  }, [pan, scale]);

  const onMouseUp = useCallback(() => {
    if (dragging.current) {
      const d = dragging.current;
      dragging.current = null;
      if (d.kind === 'card') {
        setCards(prev => { const card = prev.find(c => c.id === d.id); if (card) saveBoardCardPosition(card.id, card.posX, card.posY); return prev; });
      } else {
        setQuestionPositions(prev => { const pos = prev[d.id]; if (pos) saveQuestionPosition(d.id, pos.x, pos.y); return prev; });
      }
    }
    isPanning.current = false;
  }, [saveQuestionPosition, saveBoardCardPosition]); // eslint-disable-line

  /* ── Wheel — passive:false ── */
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

  /* ── Selected helpers ── */
  const selectedCard     = selItem?.kind === 'card'     ? cards.find(c => c.id === selItem.id) : null;
  const selectedQuestion = selItem?.kind === 'question' ? caseQuestions.find(q => q.id === selItem.id) : null;

  const openEditSelected = () => {
    if (selectedCard) { setCardForm({ ...selectedCard, unlockedByChallenge: selectedCard.unlockedByChallenge || '' }); setEditCardModal(selectedCard); }
    else if (selectedQuestion) {
      setQForm({ caseId: selectedQuestion.caseId || selCase, title: selectedQuestion.title, description: selectedQuestion.description || '', category: selectedQuestion.category || 'OSINT', order: selectedQuestion.order || 1, points: selectedQuestion.points || 100, flag: selectedQuestion.flag || '', requiredChallengeId: selectedQuestion.requiredChallengeId || '', hasVM: selectedQuestion.hasVM || false, dockerImage: selectedQuestion.dockerImage || '' });
      setEditQModal(selectedQuestion);
    }
  };
  const deleteSelected = () => { if (selectedCard) deleteCard(selectedCard.id); if (selectedQuestion) deleteQuestion(selectedQuestion.id); };
  const toggleConnectMode = () => { setConnectMode(m => !m); setConnectFirst(null); };

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

      {/* ── Admin Toolbar ── */}
      <div className="adm-board-toolbar" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px', background: '#0f0c06',
        borderBottom: '1px solid rgba(201,151,90,0.2)',
        flexShrink: 0, flexWrap: 'wrap', zIndex: 300,
      }}>
        <select className="adm-select" value={selCase}
          onChange={e => { setSelCase(e.target.value); setSelItem(null); setConnectFirst(null); }}
          style={{ minWidth: 200 }}>
          <option value="">— Senaryo seç —</option>
          {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>

        {selCase && (<>
          <button className="btn btn-primary btn-small" onClick={() => { setQForm({ ...blankQ, caseId: selCase }); setAddQModal(true); }}>+ Soru Ekle</button>
          <button className="btn btn-secondary btn-small" onClick={() => { setCardForm(blankCard); setAddCardModal(true); }}>+ Kart Ekle</button>
          <button className="adm-tool-btn" onClick={toggleConnectMode}
            style={{ background: connectMode ? 'rgba(192,57,43,0.25)' : undefined, borderColor: connectMode ? '#c0392b' : undefined, color: connectMode ? '#e74c3c' : undefined }}>
            🔗 İp Çek{connectMode ? (connectFirst ? ' (2. öğeyi seç)' : ' (1. öğeyi seç)') : ''}
          </button>
          {caseData && (
            <button className="adm-tool-btn" onClick={() => setViewReport(true)} style={{ borderColor: 'rgba(201,151,90,0.5)', color: '#c9975a' }}>
              📄 Olay Yeri Raporu
            </button>
          )}
        </>)}

        {selItem && !connectMode && (<>
          <div style={{ width: 1, height: 24, background: 'rgba(201,151,90,0.2)', margin: '0 2px' }} />
          <button className="btn btn-secondary btn-small" onClick={openEditSelected}>✏️ Düzenle</button>
          <button className="adm-btn-delete" onClick={deleteSelected}>🗑 Sil</button>
        </>)}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="adm-tool-btn" onClick={() => setScale(s => Math.min(2, s * 1.1))}>+</button>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#c9975a', padding: '4px 8px', minWidth: 40, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
          <button className="adm-tool-btn" onClick={() => setScale(s => Math.max(0.3, s * 0.9))}>−</button>
          <button className="adm-tool-btn" onClick={() => { setPan({ x: 50, y: 80 }); setScale(0.85); }}>⌂</button>
        </div>
      </div>

      {/* ── Cork Board Viewport — kullanıcı tarafıyla aynı ── */}
      <div
        ref={boardRef}
        className="db-viewport"
        style={{ flex: 1, height: 'auto', cursor: connectMode ? 'crosshair' : undefined }}
        onMouseDown={onBoardMouseDown}
        onClick={e => { if (!e.target.closest('.db-card') && !e.target.closest('.adm-board-toolbar') && !boardMoved.current) setSelItem(null); }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {!selCase && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", monospace', fontSize: 16, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none', zIndex: 5 }}>
            Senaryo seçin
          </div>
        )}

        {/* Transformed canvas */}
        <div className="db-board" style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`, transformOrigin: '0 0', backgroundImage: `url(${process.env.PUBLIC_URL}/pano-cercevesiz.png)`, backgroundSize: '1024px 576px', backgroundRepeat: 'repeat' }}>

          {/* ── SVG İpler ── */}
          <svg className="db-svg" style={{ overflow: 'visible' }}>
            {strings.map(s => {
              const from = getItemCenter(s.fromKind, s.fromId);
              const to   = getItemCenter(s.toKind,   s.toId);
              if (!from || !to) return null;
              const path = getStringPath(from, to);
              const mid  = getStringMid(from, to);
              return (
                <g key={s.id}>
                  <path d={path} stroke="#c0392b" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.9} />
                  <circle cx={mid.x} cy={mid.y} r={8} fill="#c0392b" opacity={0.75} style={{ pointerEvents: 'all', cursor: 'pointer' }} onClick={() => removeString(s.id)} />
                  <text x={mid.x} y={mid.y + 4} textAnchor="middle" fontSize={9} fill="white" style={{ pointerEvents: 'none', userSelect: 'none' }}>✕</text>
                </g>
              );
            })}
          </svg>

          {/* ── Senaryo Kartı ── */}
          {caseData && (
            <div className="db-card db-scenario-card" style={{ left: 120, top: 180, transform: 'rotate(-1.5deg)', position: 'absolute', zIndex: 2 }}>
              <div className="db-pin db-pin-red" />
              <div className="db-card-stamp">GİZLİ</div>
              <div style={{ fontFamily: 'Courier New', fontSize: 8, color: 'rgba(0,0,0,0.4)', marginBottom: 6, letterSpacing: 1 }}>DOSYA #{String(caseData.id || 1).padStart(4, '0')}</div>
              <div className="db-scenario-title">{caseData.title}</div>
              <div className="db-scenario-desc">{(caseData.story || caseData.description || '').slice(0, 100)}...</div>
              <div className="db-scenario-meta">
                <span>⭐ {caseData.totalPoints}</span>
                <span>🎯 {caseQuestions.length} soru</span>
              </div>
              <button className="db-report-btn" onClick={() => setViewReport(true)}>📄 Olay Yeri Raporu</button>
            </div>
          )}

          {/* ── Board Cards (admin kartları) ── */}
          {cards.map(card => {
            const TYPE_ICONS = { note: '📝', photo: '🖼️', video: '🎥', document: '📄', terminal: '💻', website: '🌐', audio: '🎵' };
            const isDark = ['video','terminal','website','audio'].includes(card.type);
            const TYPE_BG = { note: card.color || '#bacb9a', photo: '#f5f0e8', video: '#1a1a2e', document: '#f0ede0', terminal: '#0a0a0a', website: '#0d1117', audio: '#1a0a2e' };
            const isSelected = selItem?.kind === 'card' && selItem.id === card.id;
            return (
              <div
                key={card.id}
                className={`db-card db-admin-card db-admin-${card.type}`}
                style={{
                  left: card.posX, top: card.posY,
                  transform: `rotate(${card.rotation || 0}deg)`,
                  background: TYPE_BG[card.type] || '#f0ede0',
                  cursor: connectMode ? 'crosshair' : 'grab',
                  outline: isSelected ? '3px solid #f5c518' : undefined,
                  zIndex: isSelected ? 20 : 3,
                }}
                onMouseDown={e => startDragCard(e, card.id)}
                onClick={e => { e.stopPropagation(); if (connectMode) handleItemClick('card', card.id); }}              >
                <div className="db-pin" />
                {card.unlockedByChallenge && <div style={{ position: 'absolute', top: 6, left: 6, fontSize: 11, opacity: 0.6 }}>🔒</div>}
                <div className="db-admin-card-icon">{TYPE_ICONS[card.type] || '📁'}</div>
                <div className="db-admin-card-title" style={{ color: isDark ? '#e2e8f0' : '#1a1a1a' }}>{card.title}</div>
                {card.type === 'photo' && card.fileUrl && <img src={BASE + card.fileUrl} alt={card.title} className="db-admin-card-thumb" />}
                {card.type === 'note' && card.content && <div className="db-admin-card-preview">{card.content.slice(0, 200)}</div>}
                {['video','audio','document','terminal','website'].includes(card.type) && <div className="db-admin-card-hint">Tıkla → Görüntüle</div>}
              </div>
            );
          })}

          {/* ── Soru Kartları — kullanıcı tarafıyla birebir aynı polaroid ── */}
          {caseQuestions.map((ch, i) => {
            const pos  = questionPositions[ch.id] || defaultQPos(i);
            const icon = CATEGORY_ICONS[ch.category] || '📝';
            const catBg = CATEGORY_COLORS[ch.category] || '#1a1a1a';
            const rot  = ch.id % 2 === 0 ? -1.5 : 1.5;
            const isSelected = selItem?.kind === 'question' && selItem.id === ch.id;
            const isConnectTarget = connectMode && connectFirst && !(connectFirst.kind === 'question' && connectFirst.id === ch.id);
            return (
              <div
                key={ch.id}
                className="db-card"
                style={{
                  left: pos.x, top: pos.y,
                  transform: `rotate(${rot}deg)`,
                  width: 190, height: 240,
                  cursor: connectMode ? 'crosshair' : 'grab',
                  position: 'absolute', zIndex: isSelected ? 20 : 4,
                  background: '#f0ece0',
                  boxShadow: isSelected
                    ? '0 0 0 3px #f5c518, 4px 6px 18px rgba(0,0,0,0.55), 8px 10px 28px rgba(0,0,0,0.35)'
                    : isConnectTarget
                    ? '0 0 0 2px #c0392b, 4px 6px 18px rgba(0,0,0,0.55)'
                    : '4px 6px 18px rgba(0,0,0,0.55), 8px 10px 28px rgba(0,0,0,0.35)',
                  padding: '8px 8px 36px 8px',
                  borderRadius: 2,
                  userSelect: 'none',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseDown={e => startDragQuestion(e, ch.id)}
                onClick={e => { e.stopPropagation(); if (connectMode) handleItemClick('question', ch.id); }}              >
                <div className="db-pin" />
                <div style={{ position: 'absolute', top: 0, right: 0, background: '#5a3a00', color: '#f5e8d0', fontSize: 7, fontWeight: 900, padding: '3px 8px', letterSpacing: 1, fontFamily: '"Courier New", Courier, monospace', zIndex: 3 }}>{ch.category?.toUpperCase()}</div>
                <div style={{ position: 'absolute', top: 4, left: 8, fontFamily: '"Courier New", Courier, monospace', fontSize: 10, fontWeight: 900, color: 'rgba(60,30,10,0.45)', zIndex: 3 }}>#{ch.order}</div>
                <div style={{ width: '100%', height: '100%', background: catBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden', borderRadius: 1, position: 'relative' }}>
                  {ch.requiredChallengeId && <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 14, opacity: 0.7, zIndex: 5 }}>🔒</div>}
                  {ch.imageUrl ? (
                    <img src={BASE + ch.imageUrl} alt={ch.title} style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0, opacity:0.85 }} />
                  ) : (
                    <span style={{ fontSize: 56, lineHeight: 1 }}>{icon}</span>
                  )}
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, background: '#f0ece0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid rgba(0,0,0,0.08)', zIndex: 4, padding: '0 6px' }}>
                  <span style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 9, fontWeight: 900, color: '#2a1a08', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{ch.title}</span>
                  <span style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 8, color: '#8b6030' }}>⭐ {ch.points}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modals ── */}
      {(addCardModal || editCardModal) && (
        <BoardCardModal title={editCardModal ? 'Kartı Düzenle' : 'Yeni Kart Ekle'} form={cardForm} setForm={setCardForm} cases={cases} questions={questions} selCase={selCase} uploading={uploading} onFile={uploadFile} onSave={saveCard} onClose={() => { setAddCardModal(false); setEditCardModal(null); setCardForm(blankCard); }} />
      )}
      {(addQModal || editQModal) && (
        <QuestionModal title={editQModal ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'} form={qForm} setForm={setQForm} cases={cases} questions={questions} selCase={selCase} uploading={uploading} onFile={uploadQFile} onSave={saveQuestion} onClose={() => { setAddQModal(false); setEditQModal(null); setQForm(blankQ); }} />
      )}

      {/* ── Olay Yeri Raporu ── */}
      {viewReport && caseData && (
        <div className="db-modal-overlay db-report-overlay" onClick={() => setViewReport(false)}>
          <div className="db-report-popup" onClick={e => e.stopPropagation()}>
            <button className="db-report-close" onClick={() => setViewReport(false)}>✕ Kapat</button>
            <CrimeSceneReport caseData={caseData} unlockedSections={[]} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBoard;

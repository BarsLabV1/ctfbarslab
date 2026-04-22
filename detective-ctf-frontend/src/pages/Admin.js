import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import './Admin.css';

const CATEGORIES = ['OSINT', 'Web', 'Forensics', 'Crypto', 'Reverse', 'PWN', 'Network', 'Final'];

/* ─── tiny reusable modal ─── */
const Modal = ({ title, onClose, children }) => (
  <div className="adm-overlay" onClick={onClose}>
    <div className="adm-modal" onClick={e => e.stopPropagation()}>
      <div className="adm-modal-header">
        <h3>{title}</h3>
        <button className="adm-modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="adm-modal-body">{children}</div>
    </div>
  </div>
);

/* ─── Stats cards ─── */
const StatsBar = ({ stats }) => (
  <div className="adm-stats">
    {[
      { label: 'Kullanıcı',  value: stats.totalUsers },
      { label: 'Senaryo',    value: stats.totalCases },
      { label: 'Soru',       value: stats.totalChallenges },
      { label: 'Takım',      value: stats.totalTeams },
      { label: 'Aktif VM',   value: stats.activeSessions },
    ].map(s => (
      <div key={s.label} className="adm-stat-card">
        <span className="adm-stat-val">{s.value ?? '—'}</span>
        <span className="adm-stat-lbl">{s.label}</span>
      </div>
    ))}
  </div>
);

/* ══════════════════════════════════════════ */
const Admin = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { showToast } = useToast();

  const [tab,        setTab]        = useState('cases');   // cases | questions | evidences | boardcards | users
  const [stats,      setStats]      = useState({});
  const [cases,      setCases]      = useState([]);
  const [questions,  setQuestions]  = useState([]);
  const [evidences,  setEvidences]  = useState([]);
  const [users,      setUsers]      = useState([]);
  const [selCase,    setSelCase]    = useState(null);
  const [selCaseEv,  setSelCaseEv]  = useState(null);
  const [selCaseBoard, setSelCaseBoard] = useState(null);
  const [boardCards, setBoardCards] = useState([]);
  const [bcModal, setBcModal] = useState(null); // null | 'new' | cardObj
  const blankBC = { caseId:'', type:'note', title:'', content:'', fileUrl:'', externalUrl:'', dockerImage:'', posX:400, posY:400, rotation:0, color:'#bacb9a', unlockedByChallenge:'' }; // evidence filter

  // upload state
  const [uploading,    setUploading]    = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [evForm,       setEvForm]       = useState({ challengeId:'', title:'', description:'', order:1, fileUrl:'', type:'' });  // filter questions by case

  // modals
  const [caseModal,  setCaseModal]  = useState(null);  // null | 'new' | caseObj
  const [qModal,     setQModal]     = useState(null);  // null | 'new' | qObj

  // forms
  const blankCase = { title:'', description:'', story:'', difficulty:3, totalPoints:500, imageUrl:'' };
  const blankQ    = { caseId:'', title:'', description:'', category:'OSINT', order:1, points:100,
                      flag:'', requiredChallengeId:'', hasVM:false, dockerImage:'', vmConnectionInfo:'',
                      files:'',
                      // İpuçları — form alanları
                      hints: [],  // [{text, penaltyPercent}]
                      // Çözülünce açılan içerik — form alanları
                      unlockReportTitle: '', unlockReportType: 'evidence', unlockReportContent: '',
                      unlockBoardNoteTitle: '', unlockBoardNoteText: '',
                      unlockSuspectName: '', unlockSuspectRole: '', unlockSuspectMotive: '',
                      unlockBoardCardId: '',
                    };
  const [caseForm, setCaseForm] = useState(blankCase);
  const [qForm,    setQForm]    = useState(blankQ);

  /* ── fetch ── */
  const fetchAll = useCallback(async () => {
    try {
      const [s, c, u] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/cases'),
        api.get('/admin/users'),
      ]);
      setStats(s.data);
      const caseList = c.data;
      setCases(caseList);
      setUsers(u.data);
      // tüm soruları çek (delil formunda seçim için)
      const allQ = await Promise.all(caseList.map(ca => api.get(`/challenges/case/${ca.id}`)));
      setQuestions(allQ.flatMap((r, i) => r.data.map(q => ({ ...q, caseId: caseList[i].id }))));
    } catch { showToast('Veriler yüklenemedi', 'error'); }
  }, []); // eslint-disable-line

  const fetchQuestions = useCallback(async (caseId) => {
    if (!caseId) return;
    try {
      const res = await api.get(`/challenges/case/${caseId}`);
      setQuestions(res.data);
    } catch { showToast('Sorular yüklenemedi', 'error'); }
  }, []); // eslint-disable-line

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (selCase) fetchQuestions(selCase); }, [selCase, fetchQuestions]);

  const fetchEvidences = useCallback(async (challengeId) => {
    try {
      const url = challengeId ? `/admin/evidences?challengeId=${challengeId}` : '/admin/evidences';
      const res = await api.get(url);
      setEvidences(res.data);
    } catch { showToast('Deliller yüklenemedi', 'error'); }
  }, []); // eslint-disable-line

  useEffect(() => { if (tab === 'evidences') fetchEvidences(); }, [tab]); // eslint-disable-line

  const fetchBoardCards = useCallback(async (caseId) => {
    if (!caseId) return;
    try {
      const res = await api.get(`/board-cards/admin/case/${caseId}`);
      setBoardCards(res.data);
    } catch { showToast('Pano kartları yüklenemedi', 'error'); }
  }, []); // eslint-disable-line

  useEffect(() => { if (tab === 'boardcards' && selCaseBoard) fetchBoardCards(selCaseBoard); }, [tab, selCaseBoard]); // eslint-disable-line

  /* ── File upload ── */
  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace('/api', '');
      setEvForm(f => ({ ...f, fileUrl: res.data.fileUrl, type: res.data.fileType }));
      setUploadPreview({ name: res.data.originalName, type: res.data.fileType, url: baseUrl + res.data.fileUrl });
      showToast('Dosya yüklendi!', 'success');
    } catch { showToast('Dosya yüklenemedi', 'error'); }
    finally { setUploading(false); }
  };

  const saveEvidence = async () => {
    if (!evForm.challengeId || !evForm.title || !evForm.fileUrl) {
      showToast('Soru, başlık ve dosya zorunlu', 'warning'); return;
    }
    try {
      await api.post('/admin/evidences', {
        challengeId: parseInt(evForm.challengeId),
        title: evForm.title,
        type: evForm.type,
        fileUrl: evForm.fileUrl,
        description: evForm.description,
        order: parseInt(evForm.order) || 1,
      });
      showToast('Delil eklendi!', 'success');
      setEvForm({ challengeId:'', title:'', description:'', order:1, fileUrl:'', type:'' });
      setUploadPreview(null);
      fetchEvidences();
    } catch (err) { showToast(err.response?.data?.message || 'Hata', 'error'); }
  };

  const deleteEvidence = async (id) => {
    try {
      await api.delete(`/admin/evidences/${id}`);
      showToast('Delil silindi', 'success');
      fetchEvidences();
    } catch { showToast('Silinemedi', 'error'); }
  };

  const [bcForm, setBcForm] = useState(blankBC);

  const saveBoardCard = async () => {
    const body = {
      caseId: parseInt(bcForm.caseId || selCaseBoard),
      type: bcForm.type,
      title: bcForm.title,
      content: bcForm.content || null,
      fileUrl: bcForm.fileUrl || null,
      externalUrl: bcForm.externalUrl || null,
      dockerImage: bcForm.dockerImage || null,
      posX: parseInt(bcForm.posX) || 400,
      posY: parseInt(bcForm.posY) || 400,
      rotation: parseFloat(bcForm.rotation) || 0,
      color: bcForm.color || null,
      unlockedByChallenge: bcForm.unlockedByChallenge ? parseInt(bcForm.unlockedByChallenge) : null,
    };
    try {
      if (bcModal === 'new') {
        await api.post('/board-cards', body);
        showToast('Kart eklendi', 'success');
      } else {
        await api.put(`/board-cards/${bcModal.id}`, body);
        showToast('Kart güncellendi', 'success');
      }
      setBcModal(null);
      fetchBoardCards(selCaseBoard);
    } catch (err) { showToast(err.response?.data?.message || 'Hata', 'error'); }
  };

  const deleteBoardCard = async (id) => {
    try {
      await api.delete(`/board-cards/${id}`);
      showToast('Kart silindi', 'success');
      fetchBoardCards(selCaseBoard);
    } catch { showToast('Silinemedi', 'error'); }
  };

  /* ── guard ── */
  if (!user?.isAdmin) {
    return (
      <div className="adm-denied">
        <h2>Erişim Reddedildi</h2>
        <p>Bu sayfaya erişim yetkiniz yok.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Ana Sayfa</button>
      </div>
    );
  }

  /* ── case CRUD ── */
  const openNewCase  = () => { setCaseForm(blankCase); setCaseModal('new'); };
  const openEditCase = (c) => { setCaseForm({ title:c.title, description:c.description, story:c.story||'',
    difficulty:c.difficulty, totalPoints:c.totalPoints, imageUrl:c.imageUrl||'' }); setCaseModal(c); };

  const saveCase = async () => {
    try {
      if (caseModal === 'new') {
        await api.post('/admin/cases', caseForm);
        showToast('Senaryo oluşturuldu', 'success');
      } else {
        await api.put(`/admin/cases/${caseModal.id}`, caseForm);
        showToast('Senaryo güncellendi', 'success');
      }
      setCaseModal(null);
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || 'Hata', 'error'); }
  };

  const deleteCase = async (id) => {
    try {
      await api.delete(`/admin/cases/${id}`);
      showToast('Senaryo silindi', 'success');
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || 'Silinemedi', 'error'); }
  };

  /* ── question CRUD ── */
  const openNewQ  = () => { setQForm({ ...blankQ, caseId: selCase || '' }); setQModal('new'); };
  const openEditQ = (q) => {
    // hints JSON'ı parse et
    let hintsArr = [];
    try { hintsArr = q.hints ? JSON.parse(q.hints) : []; } catch {}

    // unlockContent JSON'ı parse et
    let uc = {};
    try { uc = q.unlockContent ? JSON.parse(q.unlockContent) : {}; } catch {}

    setQForm({
      caseId: q.caseId||selCase, title: q.title, description: q.description,
      category: q.category, order: q.order, points: q.points, flag: q.flag||'',
      requiredChallengeId: q.requiredChallengeId||'', hasVM: q.hasVM||false,
      dockerImage: q.dockerImage||'', vmConnectionInfo: q.vmConnectionInfo||'',
      files: q.files||'',
      hints: hintsArr.map(h => ({ text: h.Text||h.text||'', penaltyPercent: h.PenaltyPercent||h.penaltyPercent||10 })),
      unlockReportTitle:   uc.reportSection?.title   || '',
      unlockReportType:    uc.reportSection?.type    || 'evidence',
      unlockReportContent: uc.reportSection?.content || '',
      unlockBoardNoteTitle: uc.boardNote?.title || '',
      unlockBoardNoteText:  uc.boardNote?.text  || '',
      unlockSuspectName:   uc.boardSuspect?.name   || '',
      unlockSuspectRole:   uc.boardSuspect?.role   || '',
      unlockSuspectMotive: uc.boardSuspect?.motive || '',
    });
    setQModal(q);
  };

  const saveQ = async () => {
    // hints JSON oluştur
    const hintsJson = qForm.hints.length > 0
      ? JSON.stringify(qForm.hints.map(h => ({ Text: h.text, PenaltyPercent: parseInt(h.penaltyPercent)||10 })))
      : null;

    // unlockContent JSON oluştur
    const uc = {};
    if (qForm.unlockReportTitle && qForm.unlockReportContent) {
      uc.reportSection = { title: qForm.unlockReportTitle, type: qForm.unlockReportType, content: qForm.unlockReportContent };
    }
    if (qForm.unlockBoardNoteTitle && qForm.unlockBoardNoteText) {
      uc.boardNote = { title: qForm.unlockBoardNoteTitle, text: qForm.unlockBoardNoteText };
    }
    if (qForm.unlockSuspectName) {
      uc.boardSuspect = { name: qForm.unlockSuspectName, role: qForm.unlockSuspectRole, motive: qForm.unlockSuspectMotive };
    }

    const body = {
      caseId: parseInt(qForm.caseId),
      title: qForm.title,
      description: qForm.description,
      category: qForm.category,
      order: parseInt(qForm.order),
      points: parseInt(qForm.points),
      flag: qForm.flag,
      requiredChallengeId: qForm.requiredChallengeId ? parseInt(qForm.requiredChallengeId) : null,
      hasVM: qForm.hasVM,
      dockerImage: qForm.dockerImage || null,
      vmConnectionInfo: qForm.vmConnectionInfo || null,
      files: qForm.files || null,
      hints: hintsJson,
      unlockContent: Object.keys(uc).length > 0 ? JSON.stringify(uc) : null,
    };
    try {
      if (qModal === 'new') {
        await api.post('/admin/challenges', body);
        showToast('Soru oluşturuldu', 'success');
      } else {
        await api.put(`/admin/challenges/${qModal.id}`, body);
        showToast('Soru güncellendi', 'success');
      }
      setQModal(null);
      fetchQuestions(selCase);
    } catch (err) { showToast(err.response?.data?.message || 'Hata', 'error'); }
  };

  const deleteQ = async (id) => {
    try {
      await api.delete(`/admin/challenges/${id}`);
      showToast('Soru silindi', 'success');
      fetchQuestions(selCase);
    } catch (err) { showToast(err.response?.data?.message || 'Silinemedi', 'error'); }
  };

  /* ── render ── */
  return (
    <div className="adm-page">
      <div className="adm-topbar">
        <div className="adm-topbar-left">
          <button className="adm-back" onClick={() => navigate('/')}>← Çıkış</button>
          <h1>Admin Paneli</h1>
        </div>
        <StatsBar stats={stats} />
      </div>

      <div className="adm-tabs">
        {['cases','questions','evidences','boardcards','users'].map(t => (
          <button key={t} className={`adm-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            {{ cases:'Senaryolar', questions:'Sorular', evidences:'Deliller', boardcards:'Pano Kartları', users:'Kullanıcılar' }[t]}
          </button>
        ))}
      </div>

      <div className="adm-content">

        {/* ── CASES ── */}
        {tab === 'cases' && (
          <>
            <div className="adm-section-header">
              <h2>Senaryolar</h2>
              <button className="btn btn-primary btn-small" onClick={openNewCase}>+ Yeni Senaryo</button>
            </div>
            <table className="adm-table">
              <thead>
                <tr><th>#</th><th>Başlık</th><th>Zorluk</th><th>Puan</th><th>Sorular</th><th></th></tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id}>
                    <td className="adm-id">{c.id}</td>
                    <td className="adm-title">{c.title}</td>
                    <td>{'★'.repeat(c.difficulty)}</td>
                    <td>{c.totalPoints}</td>
                    <td>{c.challengeCount}</td>
                    <td className="adm-actions">
                      <button className="adm-btn-edit" onClick={() => openEditCase(c)}>Düzenle</button>
                      <button className="adm-btn-delete" onClick={() => deleteCase(c.id)}>Sil</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* ── QUESTIONS ── */}
        {tab === 'questions' && (
          <>
            <div className="adm-section-header">
              <h2>Sorular</h2>
              <div className="adm-section-header-right">
                <select
                  className="adm-select"
                  value={selCase || ''}
                  onChange={e => setSelCase(e.target.value)}
                >
                  <option value="">— Senaryo seç —</option>
                  {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                {selCase && (
                  <button className="btn btn-primary btn-small" onClick={openNewQ}>+ Yeni Soru</button>
                )}
              </div>
            </div>

            {!selCase ? (
              <p className="adm-hint">Sorular görmek için bir senaryo seçin.</p>
            ) : (
              <table className="adm-table">
                <thead>
                  <tr><th>#</th><th>Sıra</th><th>Başlık</th><th>Kategori</th><th>Puan</th><th>Flag</th><th></th></tr>
                </thead>
                <tbody>
                  {questions.map(q => (
                    <tr key={q.id}>
                      <td className="adm-id">{q.id}</td>
                      <td>{q.order}</td>
                      <td className="adm-title">{q.title}</td>
                      <td><span className="adm-cat">{q.category}</span></td>
                      <td>{q.points}</td>
                      <td className="adm-flag">{q.flag || '—'}</td>
                      <td className="adm-actions">
                        <button className="adm-btn-edit" onClick={() => openEditQ(q)}>Düzenle</button>
                        <button className="adm-btn-delete" onClick={() => deleteQ(q.id)}>Sil</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* ── EVIDENCES ── */}
        {tab === 'evidences' && (
          <>
            <div className="adm-section-header">
              <h2>Deliller</h2>
              <select className="adm-select" value={selCaseEv||''} onChange={e=>{setSelCaseEv(e.target.value); fetchEvidences(e.target.value ? questions.filter(q=>q.caseId==e.target.value).map(q=>q.id) : null);}}>
                <option value="">Tüm deliller</option>
                {cases.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            {/* Upload form */}
            <div className="adm-ev-upload-card">
              <h3>Yeni Delil Ekle</h3>
              <div className="adm-ev-form">
                <div className="adm-ev-dropzone"
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>{e.preventDefault(); handleFileUpload(e.dataTransfer.files[0]);}}>
                  {uploading ? (
                    <div className="adm-ev-uploading">Yükleniyor...</div>
                  ) : uploadPreview ? (
                    <div className="adm-ev-preview">
                      {uploadPreview.type === 'video' && <video src={uploadPreview.url} controls className="adm-ev-media"/>}
                      {uploadPreview.type === 'audio' && <audio src={uploadPreview.url} controls className="adm-ev-audio"/>}
                      {uploadPreview.type === 'image' && <img src={uploadPreview.url} alt="" className="adm-ev-media"/>}
                      {!['video','audio','image'].includes(uploadPreview.type) && (
                        <div className="adm-ev-file-icon">
                          {uploadPreview.type==='document'?'📄':uploadPreview.type==='log'?'📋':'📁'}
                          <span>{uploadPreview.name}</span>
                        </div>
                      )}
                      <button className="adm-ev-clear" onClick={()=>{setUploadPreview(null);setEvForm(f=>({...f,fileUrl:'',type:''}));}}>✕ Kaldır</button>
                    </div>
                  ) : (
                    <label className="adm-ev-drop-label">
                      <input type="file" accept="video/*,audio/*,image/*,.pdf,.doc,.docx,.txt,.log,.csv,.json"
                        onChange={e=>handleFileUpload(e.target.files[0])} style={{display:'none'}}/>
                      <div className="adm-ev-drop-icon">📎</div>
                      <div>Dosyayı sürükle veya <span>seç</span></div>
                      <div className="adm-ev-drop-hint">Video, ses, resim, PDF, belge, log — max 200MB</div>
                    </label>
                  )}
                </div>

                <div className="adm-ev-fields">
                  <div className="adm-form-row">
                    <div>
                      <label>Soru *</label>
                      <select value={evForm.challengeId} onChange={e=>setEvForm(f=>({...f,challengeId:e.target.value}))}>
                        <option value="">Senaryo → Soru seç</option>
                        {cases.map(c=>(
                          <optgroup key={c.id} label={c.title}>
                            {questions.filter(q=>String(q.caseId||selCase)===String(c.id)).map(q=>(
                              <option key={q.id} value={q.id}>#{q.order} {q.title}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Sıra</label>
                      <input type="number" min={1} value={evForm.order} onChange={e=>setEvForm(f=>({...f,order:e.target.value}))}/>
                    </div>
                  </div>
                  <label>Başlık *</label>
                  <input placeholder="Delil başlığı" value={evForm.title} onChange={e=>setEvForm(f=>({...f,title:e.target.value}))}/>
                  <label>Açıklama</label>
                  <textarea rows={2} placeholder="Opsiyonel açıklama" value={evForm.description} onChange={e=>setEvForm(f=>({...f,description:e.target.value}))}/>
                  <button className="btn btn-primary" onClick={saveEvidence} disabled={!evForm.fileUrl}>
                    {evForm.fileUrl ? '+ Delil Ekle' : 'Önce dosya yükle'}
                  </button>
                </div>
              </div>
            </div>

            {/* Evidence list */}
            <table className="adm-table" style={{marginTop:24}}>
              <thead>
                <tr><th>#</th><th>Tür</th><th>Başlık</th><th>Soru</th><th>Senaryo</th><th></th></tr>
              </thead>
              <tbody>
                {evidences.map(e=>(
                  <tr key={e.id}>
                    <td className="adm-id">{e.id}</td>
                    <td><span className={`adm-ev-type adm-ev-${e.type}`}>{e.type}</span></td>
                    <td className="adm-title">{e.title}</td>
                    <td>{e.challengeName}</td>
                    <td className="adm-email">{e.caseName}</td>
                    <td className="adm-actions">
                      <a href={(process.env.REACT_APP_API_URL||'http://localhost:5001/api').replace('/api','')+e.fileUrl}
                        target="_blank" rel="noopener noreferrer" className="adm-btn-edit">Görüntüle</a>
                      <button className="adm-btn-delete" onClick={()=>deleteEvidence(e.id)}>Sil</button>
                    </td>
                  </tr>
                ))}
                {evidences.length===0 && <tr><td colSpan={6} style={{textAlign:'center',color:'#475569',padding:32}}>Henüz delil yok</td></tr>}
              </tbody>
            </table>
          </>
        )}

        {/* ── BOARD CARDS ── */}
        {tab === 'boardcards' && (
          <>
            <div className="adm-section-header">
              <h2>Pano Kartları</h2>
              <div className="adm-section-header-right">
                <select className="adm-select" value={selCaseBoard||''} onChange={e=>{setSelCaseBoard(e.target.value); fetchBoardCards(e.target.value);}}>
                  <option value="">— Senaryo seç —</option>
                  {cases.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                {selCaseBoard && (
                  <button className="btn btn-primary btn-small" onClick={()=>{setBcForm({...blankBC, caseId:selCaseBoard}); setBcModal('new');}}>
                    + Yeni Kart
                  </button>
                )}
              </div>
            </div>

            {!selCaseBoard ? (
              <p className="adm-hint">Pano kartlarını görmek için senaryo seçin.</p>
            ) : (
              <table className="adm-table">
                <thead>
                  <tr><th>#</th><th>Tip</th><th>Başlık</th><th>Pozisyon</th><th>Kilit</th><th></th></tr>
                </thead>
                <tbody>
                  {boardCards.map(bc => (
                    <tr key={bc.id}>
                      <td className="adm-id">{bc.id}</td>
                      <td><span className="adm-cat">{bc.type}</span></td>
                      <td className="adm-title">{bc.title}</td>
                      <td className="adm-email">X:{bc.posX} Y:{bc.posY}</td>
                      <td>{bc.unlockedByChallenge ? `Soru #${bc.unlockedByChallenge}` : '—'}</td>
                      <td className="adm-actions">
                        <button className="adm-btn-edit" onClick={()=>{setBcForm({...bc, unlockedByChallenge:bc.unlockedByChallenge||''}); setBcModal(bc);}}>Düzenle</button>
                        <button className="adm-btn-delete" onClick={()=>deleteBoardCard(bc.id)}>Sil</button>
                      </td>
                    </tr>
                  ))}
                  {boardCards.length===0 && <tr><td colSpan={6} style={{textAlign:'center',color:'#475569',padding:32}}>Henüz kart yok</td></tr>}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <>
            <div className="adm-section-header"><h2>Kullanıcılar</h2></div>
            <table className="adm-table">
              <thead>
                <tr><th>#</th><th>Kullanıcı</th><th>E-posta</th><th>Puan</th><th>Çözülen</th><th>Admin</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="adm-id">{u.id}</td>
                    <td className="adm-title">{u.username}</td>
                    <td className="adm-email">{u.email}</td>
                    <td>{u.totalScore}</td>
                    <td>{u.solvedChallenges}</td>
                    <td>{u.isAdmin ? <span className="adm-badge-admin">Admin</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* ── Board Card Modal ── */}
      {bcModal && (
        <Modal title={bcModal === 'new' ? 'Yeni Pano Kartı' : 'Kartı Düzenle'} onClose={() => setBcModal(null)}>
          <div className="adm-form">
            <div className="adm-form-row">
              <div>
                <label>Tip *</label>
                <select value={bcForm.type} onChange={e=>setBcForm(f=>({...f,type:e.target.value}))}>
                  <option value="note">📝 Not</option>
                  <option value="photo">🖼️ Fotoğraf</option>
                  <option value="video">🎥 Video</option>
                  <option value="document">📄 Belge</option>
                  <option value="terminal">💻 Terminal (Docker)</option>
                  <option value="website">🌐 Web Sitesi</option>
                  <option value="audio">🎵 Ses Kaydı</option>
                </select>
              </div>
              <div>
                <label>Renk (not için)</label>
                <input type="color" value={bcForm.color||'#bacb9a'} onChange={e=>setBcForm(f=>({...f,color:e.target.value}))} style={{height:38,padding:4}}/>
              </div>
            </div>

            <label>Başlık *</label>
            <input placeholder="Kart başlığı" value={bcForm.title} onChange={e=>setBcForm(f=>({...f,title:e.target.value}))}/>

            {['note','document'].includes(bcForm.type) && (
              <>
                <label>Metin İçeriği</label>
                <textarea rows={4} placeholder="Kart üzerinde görünecek metin" value={bcForm.content||''} onChange={e=>setBcForm(f=>({...f,content:e.target.value}))}/>
              </>
            )}

            {['photo','video','audio','document'].includes(bcForm.type) && (
              <>
                <label>Dosya Yükle</label>
                <div className="adm-file-upload-area">
                  {bcForm.fileUrl ? (
                    <div className="adm-file-preview">
                      {bcForm.type === 'photo' && (
                        <img src={(process.env.REACT_APP_API_URL||'http://localhost:5001/api').replace('/api','') + bcForm.fileUrl} alt="" className="adm-ev-media"/>
                      )}
                      {bcForm.type === 'video' && (
                        <video src={(process.env.REACT_APP_API_URL||'http://localhost:5001/api').replace('/api','') + bcForm.fileUrl} controls className="adm-ev-media"/>
                      )}
                      {bcForm.type === 'audio' && (
                        <audio src={(process.env.REACT_APP_API_URL||'http://localhost:5001/api').replace('/api','') + bcForm.fileUrl} controls className="adm-ev-audio"/>
                      )}
                      {bcForm.type === 'document' && (
                        <div className="adm-ev-file-icon">📄<span>{bcForm.fileUrl.split('/').pop()}</span></div>
                      )}
                      <button className="adm-ev-clear" onClick={()=>setBcForm(f=>({...f,fileUrl:''}))}>✕ Kaldır</button>
                    </div>
                  ) : (
                    <label className="adm-ev-drop-label"
                      onDragOver={e=>e.preventDefault()}
                      onDrop={async e=>{
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (!file) return;
                        const fd = new FormData(); fd.append('file', file);
                        try {
                          const res = await api.post('/admin/upload', fd, {headers:{'Content-Type':'multipart/form-data'}});
                          setBcForm(f=>({...f, fileUrl: res.data.fileUrl}));
                          showToast('Dosya yüklendi!', 'success');
                        } catch { showToast('Yükleme başarısız', 'error'); }
                      }}>
                      <input
                        type="file"
                        accept={bcForm.type==='photo'?'image/*':bcForm.type==='video'?'video/*':bcForm.type==='audio'?'audio/*':'*'}
                        style={{display:'none'}}
                        onChange={async e=>{
                          const file = e.target.files[0];
                          if (!file) return;
                          const fd = new FormData(); fd.append('file', file);
                          try {
                            const res = await api.post('/admin/upload', fd, {headers:{'Content-Type':'multipart/form-data'}});
                            setBcForm(f=>({...f, fileUrl: res.data.fileUrl}));
                            showToast('Dosya yüklendi!', 'success');
                          } catch { showToast('Yükleme başarısız', 'error'); }
                        }}
                      />
                      <div className="adm-ev-drop-icon">
                        {bcForm.type==='photo'?'🖼️':bcForm.type==='video'?'🎥':bcForm.type==='audio'?'🎵':'📄'}
                      </div>
                      <div>Dosyayı sürükle veya <span>seç</span></div>
                      <div className="adm-ev-drop-hint">
                        {bcForm.type==='photo'?'JPG, PNG, GIF, WEBP':bcForm.type==='video'?'MP4, AVI, MOV, WEBM':bcForm.type==='audio'?'MP3, WAV, OGG, M4A':'PDF, DOC, TXT, LOG'} — max 200MB
                      </div>
                    </label>
                  )}
                </div>
              </>
            )}

            {bcForm.type === 'website' && (
              <>
                <label>Web Sitesi URL</label>
                <input placeholder="http://192.168.1.100:8080" value={bcForm.externalUrl||''} onChange={e=>setBcForm(f=>({...f,externalUrl:e.target.value}))}/>
              </>
            )}

            {bcForm.type === 'terminal' && (
              <>
                <label>Docker Image</label>
                <input placeholder="detectivectf/ssh-target:latest" value={bcForm.dockerImage||''} onChange={e=>setBcForm(f=>({...f,dockerImage:e.target.value}))}/>
              </>
            )}

            <div className="adm-section-divider">📍 Pano Pozisyonu</div>
            <div className="adm-form-row">
              <div><label>X Koordinatı</label><input type="number" value={bcForm.posX} onChange={e=>setBcForm(f=>({...f,posX:e.target.value}))}/></div>
              <div><label>Y Koordinatı</label><input type="number" value={bcForm.posY} onChange={e=>setBcForm(f=>({...f,posY:e.target.value}))}/></div>
              <div><label>Rotasyon (°)</label><input type="number" min={-10} max={10} step={0.5} value={bcForm.rotation} onChange={e=>setBcForm(f=>({...f,rotation:e.target.value}))}/></div>
            </div>

            <div className="adm-section-divider">🔒 Kilit</div>
            <label>Hangi soru çözülünce açılsın? (boş = baştan açık)</label>
            <select value={bcForm.unlockedByChallenge||''} onChange={e=>setBcForm(f=>({...f,unlockedByChallenge:e.target.value}))}>
              <option value="">Baştan açık</option>
              {questions.filter(q=>String(q.caseId||selCaseBoard)===String(selCaseBoard)).map(q=>(
                <option key={q.id} value={q.id}>#{q.order} {q.title}</option>
              ))}
            </select>

            <div className="adm-form-actions">
              <button className="btn btn-primary" onClick={saveBoardCard}>Kaydet</button>
              <button className="btn btn-secondary" onClick={()=>setBcModal(null)}>İptal</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Case Modal ── */}
      {caseModal && (
        <Modal title={caseModal === 'new' ? 'Yeni Senaryo' : 'Senaryo Düzenle'} onClose={() => setCaseModal(null)}>
          <div className="adm-form">
            <label>Başlık *</label>
            <input value={caseForm.title} onChange={e => setCaseForm(f=>({...f,title:e.target.value}))} placeholder="Senaryo başlığı" />
            <label>Kısa Açıklama *</label>
            <textarea rows={2} value={caseForm.description} onChange={e => setCaseForm(f=>({...f,description:e.target.value}))} placeholder="Liste sayfasında görünür" />
            <label>Hikaye</label>
            <textarea rows={4} value={caseForm.story} onChange={e => setCaseForm(f=>({...f,story:e.target.value}))} placeholder="Oyun içi senaryo metni" />
            <div className="adm-form-row">
              <div>
                <label>Zorluk (1-5)</label>
                <input type="number" min={1} max={5} value={caseForm.difficulty} onChange={e => setCaseForm(f=>({...f,difficulty:+e.target.value}))} />
              </div>
              <div>
                <label>Toplam Puan</label>
                <input type="number" value={caseForm.totalPoints} onChange={e => setCaseForm(f=>({...f,totalPoints:+e.target.value}))} />
              </div>
            </div>
            <div className="adm-form-actions">
              <button className="btn btn-primary" onClick={saveCase}>Kaydet</button>
              <button className="btn btn-secondary" onClick={() => setCaseModal(null)}>İptal</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Question Modal ── */}
      {qModal && (
        <Modal title={qModal === 'new' ? 'Yeni Soru' : 'Soru Düzenle'} onClose={() => setQModal(null)}>
          <div className="adm-form">
            <div className="adm-form-row">
              <div>
                <label>Senaryo *</label>
                <select value={qForm.caseId} onChange={e => setQForm(f=>({...f,caseId:e.target.value}))}>
                  <option value="">Seç</option>
                  {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label>Sıra *</label>
                <input type="number" min={1} value={qForm.order} onChange={e => setQForm(f=>({...f,order:e.target.value}))} />
              </div>
            </div>
            <label>Başlık *</label>
            <input value={qForm.title} onChange={e => setQForm(f=>({...f,title:e.target.value}))} placeholder="Soru başlığı" />
            <label>Açıklama *</label>
            <textarea rows={3} value={qForm.description} onChange={e => setQForm(f=>({...f,description:e.target.value}))} placeholder="Soru açıklaması" />
            <div className="adm-form-row">
              <div>
                <label>Kategori</label>
                <select value={qForm.category} onChange={e => setQForm(f=>({...f,category:e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label>Puan</label>
                <input type="number" value={qForm.points} onChange={e => setQForm(f=>({...f,points:e.target.value}))} />
              </div>
            </div>
            <label>Flag (CTF{"{...}"})</label>
            <input value={qForm.flag} onChange={e => setQForm(f=>({...f,flag:e.target.value}))} placeholder="CTF{flag_buraya}" className="adm-flag-input" />
            <label>Önceki Soru ID (kilit için)</label>
            <input type="number" value={qForm.requiredChallengeId} onChange={e => setQForm(f=>({...f,requiredChallengeId:e.target.value}))} placeholder="Boş bırakırsan ilk soru olur" />

            {/* ── İpuçları ── */}
            <div className="adm-section-divider">💡 İpuçları</div>
            {qForm.hints.map((h, i) => (
              <div key={i} className="adm-hint-row">
                <input
                  placeholder="İpucu metni"
                  value={h.text}
                  onChange={e => setQForm(f => ({ ...f, hints: f.hints.map((x,j) => j===i ? {...x, text: e.target.value} : x) }))}
                  style={{flex:1}}
                />
                <input
                  type="number" min={1} max={100}
                  placeholder="% ceza"
                  value={h.penaltyPercent}
                  onChange={e => setQForm(f => ({ ...f, hints: f.hints.map((x,j) => j===i ? {...x, penaltyPercent: e.target.value} : x) }))}
                  style={{width:80}}
                />
                <button className="adm-hint-remove" onClick={() => setQForm(f => ({ ...f, hints: f.hints.filter((_,j) => j!==i) }))}>✕</button>
              </div>
            ))}
            <button className="adm-hint-add" onClick={() => setQForm(f => ({ ...f, hints: [...f.hints, {text:'', penaltyPercent:10}] }))}>
              + İpucu Ekle
            </button>

            {/* ── Çözülünce açılan içerik ── */}
            <div className="adm-section-divider">🔓 Çözülünce Açılacak İçerik</div>

            {/* Pano kartı aç */}
            <div className="adm-unlock-section">
              <div className="adm-unlock-label">🗂️ Pano Kartı Aç (önceden eklenen)</div>
              <select value={qForm.unlockBoardCardId||''} onChange={e=>setQForm(f=>({...f,unlockBoardCardId:e.target.value}))}>
                <option value="">— Kart seçme (opsiyonel) —</option>
                {boardCards.filter(bc=>String(bc.caseId)===String(qForm.caseId||selCase)).map(bc=>(
                  <option key={bc.id} value={bc.id}>{bc.type.toUpperCase()} — {bc.title}</option>
                ))}
              </select>
              <p style={{fontSize:11,color:'#475569',marginTop:4}}>Seçilen kart bu soru çözülünce panoda açılır (kilit kalkar)</p>
            </div>

            <div className="adm-unlock-section">
              <div className="adm-unlock-label">📄 Rapor Belgesi</div>
              <input placeholder="Belge başlığı (örn: Şüpheli Tespit Edildi)" value={qForm.unlockReportTitle}
                onChange={e => setQForm(f=>({...f, unlockReportTitle: e.target.value}))} />
              <select value={qForm.unlockReportType} onChange={e => setQForm(f=>({...f, unlockReportType: e.target.value}))}>
                <option value="evidence">🔬 Adli Bulgu</option>
                <option value="suspect">🚨 Şüpheli Profili</option>
                <option value="witness">👁️ Tanık İfadesi</option>
                <option value="document">📄 Resmi Belge</option>
                <option value="info">📋 Bilgi Notu</option>
              </select>
              <textarea rows={3} placeholder="Belge içeriği..." value={qForm.unlockReportContent}
                onChange={e => setQForm(f=>({...f, unlockReportContent: e.target.value}))} />
            </div>

            <div className="adm-unlock-section">
              <div className="adm-unlock-label">🔍 Panoya Not</div>
              <input placeholder="Not başlığı" value={qForm.unlockBoardNoteTitle}
                onChange={e => setQForm(f=>({...f, unlockBoardNoteTitle: e.target.value}))} />
              <textarea rows={2} placeholder="Not içeriği..." value={qForm.unlockBoardNoteText}
                onChange={e => setQForm(f=>({...f, unlockBoardNoteText: e.target.value}))} />
            </div>

            <div className="adm-unlock-section">
              <div className="adm-unlock-label">🚨 Panoya Şüpheli</div>
              <div className="adm-form-row">
                <input placeholder="Ad Soyad" value={qForm.unlockSuspectName}
                  onChange={e => setQForm(f=>({...f, unlockSuspectName: e.target.value}))} />
                <input placeholder="Rol / Meslek" value={qForm.unlockSuspectRole}
                  onChange={e => setQForm(f=>({...f, unlockSuspectRole: e.target.value}))} />
              </div>
              <input placeholder="Motif" value={qForm.unlockSuspectMotive}
                onChange={e => setQForm(f=>({...f, unlockSuspectMotive: e.target.value}))} />
            </div>
            <div className="adm-form-row adm-vm-row">
              <label className="adm-checkbox-label">
                <input type="checkbox" checked={qForm.hasVM} onChange={e => setQForm(f=>({...f,hasVM:e.target.checked}))} />
                VM var
              </label>
            </div>
            {qForm.hasVM && (
              <>
                <label>Docker Image</label>
                <input value={qForm.dockerImage} onChange={e => setQForm(f=>({...f,dockerImage:e.target.value}))} placeholder="ctf/image:latest" />
                <label>VM Bağlantı Bilgisi (JSON)</label>
                <input value={qForm.vmConnectionInfo} onChange={e => setQForm(f=>({...f,vmConnectionInfo:e.target.value}))} placeholder='{"port":22}' />
              </>
            )}
            <div className="adm-form-actions">
              <button className="btn btn-primary" onClick={saveQ}>Kaydet</button>
              <button className="btn btn-secondary" onClick={() => setQModal(null)}>İptal</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Admin;

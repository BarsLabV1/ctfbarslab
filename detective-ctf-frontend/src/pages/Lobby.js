import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ConfirmModal from '../components/ConfirmModal';
import HackerAvatar from '../components/HackerAvatar';
import './Lobby.css';

const ROLES = [
  { id: 'OSINT',    name: 'OSINT',         icon: '🔍', description: 'Açık kaynak istihbaratı' },
  { id: 'Web',      name: 'WEB_EXPLOIT',   icon: '🌐', description: 'Web güvenlik açıkları'  },
  { id: 'Forensics',name: 'FORENSICS',     icon: '🔬', description: 'Dijital adli bilişim'   },
  { id: 'Crypto',   name: 'CRYPTO',        icon: '🔐', description: 'Şifreleme & kriptografi' },
  { id: 'Reverse',  name: 'REV_ENG',       icon: '⚙️', description: 'Tersine mühendislik'   },
  { id: 'PWN',      name: 'BINARY_EXPLOIT',icon: '💣', description: 'Binary sömürü'          },
  { id: 'Network',  name: 'NETWORK',       icon: '📡', description: 'Ağ güvenliği'           },
];

const Lobby = () => {
  const navigate    = useNavigate();
  const { caseId }  = useParams();
  const { user }    = useAuth();
  const { showToast } = useToast();

  const [myTeam,          setMyTeam]          = useState(null);
  const [view,            setView]            = useState('mode');
  const [selectedRole,    setSelectedRole]    = useState('');
  const [teamName,        setTeamName]        = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [inviteCode,      setInviteCode]      = useState('');
  const [loading,         setLoading]         = useState(false);
  const [kickTarget,      setKickTarget]      = useState(null);
  const [joinStep,        setJoinStep]        = useState('code'); // 'code' | 'role'
  const [takenRolesForJoin, setTakenRolesForJoin] = useState([]);
  const pollingRef = useRef(null);

  const destination = caseId ? `/play/${caseId}` : '/cases';

  useEffect(() => {
    fetchMyTeam();
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []); // eslint-disable-line

  // Takımdayken her 3 saniyede bir güncelle
  useEffect(() => {
    if (view === 'team' && myTeam) {
      pollingRef.current = setInterval(() => { fetchMyTeamSilent(); }, 3000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [view, myTeam?.teamId]); // eslint-disable-line

  const fetchMyTeam = async () => {
    try {
      const res = await api.get('/teams/my-team');
      if (res.data.hasTeam) { setMyTeam(res.data); setView('team'); }
      else setMyTeam(false);
    } catch { setMyTeam(false); }
  };

  const fetchMyTeamSilent = async () => {
    try {
      const res = await api.get('/teams/my-team');
      if (res.data.hasTeam) setMyTeam(res.data);
    } catch {}
  };

  const handleSoloStart = () => {
    if (!selectedRole) { showToast('Rol seçmelisiniz', 'warning'); return; }
    navigate(destination);
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) { showToast('Takım adı gerekli', 'warning'); return; }
    if (!selectedRole)    { showToast('Rol seçmelisiniz', 'warning');  return; }
    setLoading(true);
    try {
      await api.post('/teams/create', { name: teamName.trim(), description: teamDescription.trim(), leaderRole: selectedRole });
      showToast('Takım oluşturuldu!', 'success');
      await fetchMyTeam();
    } catch (err) {
      showToast(err.response?.data?.message || 'Takım oluşturulamadı', 'error');
    } finally { setLoading(false); }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) { showToast('Davet kodu gerekli', 'warning'); return; }
    if (!selectedRole)      { showToast('Rol seçmelisiniz', 'warning');   return; }
    setLoading(true);
    try {
      const res = await api.post('/teams/join-by-code', { inviteCode: inviteCode.toUpperCase().trim(), role: selectedRole });
      showToast(`${res.data.teamName} takımına katıldınız!`, 'success');
      await fetchMyTeam();
    } catch (err) {
      showToast(err.response?.data?.message || 'Takıma katılamadınız', 'error');
    } finally { setLoading(false); }
  };

  // Adım 1: kodu doğrula, alınan rolleri çek
  const handleCheckCode = async () => {
    if (inviteCode.trim().length !== 6) { showToast('6 haneli kod girin', 'warning'); return; }
    setLoading(true);
    try {
      const res = await api.get(`/teams/taken-roles/${inviteCode.toUpperCase().trim()}`);
      setTakenRolesForJoin(res.data);
      setJoinStep('role');
    } catch {
      showToast('Geçersiz davet kodu', 'error');
    } finally { setLoading(false); }
  };

  // Adım 2: rol seçip katıl
  const handleJoinWithRole = async () => {
    if (!selectedRole) { showToast('Rol seçmelisiniz', 'warning'); return; }
    setLoading(true);
    try {
      const res = await api.post('/teams/join-by-code', { inviteCode: inviteCode.toUpperCase().trim(), role: selectedRole });
      showToast(`${res.data.teamName} takımına katıldınız!`, 'success');
      await fetchMyTeam();
    } catch (err) {
      showToast(err.response?.data?.message || 'Takıma katılamadınız', 'error');
    } finally { setLoading(false); }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Takımdan ayrılmak istediğine emin misin?')) return;
    try {
      await api.delete('/teams/leave');
      showToast('Takımdan ayrıldınız', 'success');
      setMyTeam(false);
      setView('mode');
    } catch (err) {
      showToast(err.response?.data?.message || 'Hata oluştu', 'error');
    }
  };

  const handleKick = (userId, username) => setKickTarget({ userId, username });

  const confirmKick = async () => {
    const { userId, username } = kickTarget;
    setKickTarget(null);
    try {
      await api.delete(`/teams/${myTeam.teamId}/kick/${userId}`);
      showToast(`${username} takımdan çıkarıldı`, 'success');
      await fetchMyTeam();
    } catch (err) {
      showToast(err.response?.data?.message || 'Üye çıkarılamadı', 'error');
    }
  };

  const copyInviteCode = () => {
    const code = myTeam.inviteCode;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code).then(() => showToast('Kopyalandı!', 'success')).catch(() => fallbackCopy(code));
    } else fallbackCopy(code);
  };

  const fallbackCopy = (text) => {
    const el = document.createElement('textarea');
    el.value = text; el.style.position = 'fixed'; el.style.opacity = '0';
    document.body.appendChild(el); el.focus(); el.select();
    try { document.execCommand('copy'); showToast('Kopyalandı!', 'success'); } catch { showToast(`Kod: ${text}`, 'info'); }
    document.body.removeChild(el);
  };

  /* ── Loading ── */
  if (myTeam === null) {
    return (
      <div className="lobby-loading">
        <div className="spinner" />
        <span>BAĞLANIYOR...</span>
      </div>
    );
  }

  /* ── Mod seçimi ── */
  if (view === 'mode') {
    return (
      <div className="lobby-simple">
        <div className="lobby-simple-header">
          <div className="lobby-simple-tag">// SIZDIRMA_PROTOKOLÜ</div>
          <div className="lobby-simple-title">NASIL OYNAMAK İSTİYORSUN?</div>
        </div>
        <div className="mode-grid">
          <div className="mode-card" onClick={() => setView('solo')}>
            <div className="mode-icon">🎯</div>
            <h2>SOLO_MOD</h2>
            <p>Tek başına çöz, kendi hızında ilerle</p>
          </div>
          <div className="mode-card" onClick={() => setView('team')}>
            <div className="mode-icon">👥</div>
            <h2>TAKIM_MODU</h2>
            <p>4 kişilik takım kur veya davet koduyla katıl</p>
          </div>
        </div>
        <button onClick={() => navigate(caseId ? `/cases/${caseId}` : '/cases')} className="btn btn-secondary" style={{ marginTop: 24 }}>
          ← GERİ
        </button>
      </div>
    );
  }

  /* ── Solo ── */
  if (view === 'solo') {
    return (
      <div className="lobby-simple">
        <div className="lobby-simple-header">
          <div className="lobby-simple-tag">// SOLO_OPERATİF</div>
          <div className="lobby-simple-title">UZMANLIK SEÇ</div>
        </div>
        <div className="roles-grid">
          {ROLES.map(r => (
            <div key={r.id} className={`role-card ${selectedRole === r.id ? 'selected' : ''}`} onClick={() => setSelectedRole(r.id)}>
              <div className="role-icon">{r.icon}</div>
              <h3>{r.name}</h3>
              <p>{r.description}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {selectedRole && <button onClick={handleSoloStart} className="btn btn-primary btn-large">🚀 BAŞLA</button>}
          <button onClick={() => setView('mode')} className="btn btn-secondary">← GERİ</button>
        </div>
      </div>
    );
  }

  /* ── Takımda: SQUAD_READY ekranı ── */
  if (view === 'team' && myTeam) {
    const slots = [...(myTeam.members || [])];
    while (slots.length < 4) slots.push(null);
    const takenRoles = myTeam.takenRoles || myTeam.members?.map(m => m.role) || [];

    return (
      <>
        <div className="lobby-wrap">
          <div className="lobby-topbar">
            <span className="topbar-os">NOIR_OS V2.4</span>
            <span className="topbar-intel">İSTİHBARAT_BANKASI: {myTeam.totalScore?.toLocaleString() ?? 0} XP</span>
            <span className="topbar-status">SİSTEM_DURUMU: ŞİFRELİ</span>
          </div>

          <div className="lobby-grid">
            {/* Sol sidebar */}
            <div className="lobby-sidebar">
              <div className="lobby-sidebar-user">
                <div className="sidebar-user-avatar"><HackerAvatar role={myTeam.myRole} isYou size={48} /></div>
                <div className="sidebar-user-name">OPERATİF_{(user?.username || 'KULLANICI').toUpperCase()}</div>
                <div className="sidebar-user-role">YETKİ: OMEGA</div>
              </div>
              <nav>
                <Link to="/cases"       className="lobby-nav-item"><span className="nav-icon">📁</span>VAKALAR</Link>
                <div                    className="lobby-nav-item active"><span className="nav-icon">⬛</span>PANO</div>
                <Link to="/challenges"  className="lobby-nav-item"><span className="nav-icon">💻</span>TERMINAL</Link>
                <Link to="/leaderboard" className="lobby-nav-item"><span className="nav-icon">🏆</span>SIRALAMA</Link>
              </nav>
              <div className="lobby-sidebar-bottom">
                <div className="network-node">
                  <div className="network-node-label">AĞ DÜĞÜMÜ</div>
                  <div className="network-node-ip">
                    <span>10.10.74.179</span>
                    <span className="network-dot" />
                  </div>
                  <div className="network-latency">GECİKME: 14MS</div>
                </div>
              </div>
            </div>

            {/* Merkez */}
            <div className="lobby-center">
              <div className="lobby-center-header">
                <div className="lobby-center-tag">// SİZDİRMA_PROTOKOLÜ #{myTeam.teamId}-DELTA · Her 3sn güncelleniyor</div>
                <div className="lobby-center-title">TAKIM_HAZIR</div>
                <div className="lobby-center-desc">
                  Göreve başlamadan önce tüm takım üyelerinin VM'lerini senkronize ettiğinden emin ol.
                </div>
                <div className="lobby-mission-ref">
                  <span className="mission-ref-label">GÖREV REFERANSI</span>
                  <span className="mission-ref-code" onClick={copyInviteCode}>
                    {myTeam.teamName?.toUpperCase().replace(/ /g, '_') || 'X9-NULL-VOID'} 📋
                  </span>
                </div>
              </div>

              {/* Davet kodu */}
              {myTeam.isLeader && (
                <div className="invite-section">
                  <div>
                    <div className="invite-label">DAVET KODU</div>
                    <div className="invite-code">{myTeam.inviteCode}</div>
                  </div>
                  <button className="invite-copy-btn" onClick={copyInviteCode}>📋 KOPYALA</button>
                </div>
              )}

              {/* Üye slotları */}
              <div className="members-grid">
                {slots.map((m, i) => m ? (
                  <div key={i} className={`member-slot ${m.userId === myTeam.myUserId ? 'is-you' : ''}`}>
                    {m.userId === myTeam.myUserId && <span className="member-slot-you-tag">SEN</span>}
                    <HackerAvatar role={m.role} isYou={m.userId === myTeam.myUserId} size={80} />
                    <div className="member-slot-info">
                      <div className="member-slot-name">{m.username?.toUpperCase() || 'OPERATİF'}</div>
                      <div className="member-slot-role-label">ROL:</div>
                      <div className="member-slot-role">{m.role?.toUpperCase() || 'ATANMADI'}</div>
                      <div className="member-tags">
                        {m.isLeader && <span className="member-tag">LİDER</span>}
                        <span className="member-tag">{m.role?.toUpperCase() || 'KEŞIF'}</span>
                      </div>
                    </div>
                    {myTeam.isLeader && !m.isLeader && (
                      <button className="kick-btn" onClick={() => handleKick(m.userId, m.username)}>ÇIKAR</button>
                    )}
                  </div>
                ) : (
                  <div key={i} className="member-slot empty">
                    <div style={{ textAlign: 'center' }}>
                      <div className="member-slot-empty-icon">👤</div>
                      <div className="member-slot-empty-text">OPERATİF BEKLENİYOR</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Alınan roller */}
              {takenRoles.length > 0 && (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>
                    ALINAN ROLLER
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {takenRoles.map((r, i) => (
                      <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 10px', background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.2)', color: '#ff3b3b' }}>
                        {r?.toUpperCase()} ✗
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => navigate(destination)} className="lobby-start-btn">
                🚀 {caseId ? 'SENARYOYA BAŞLA' : 'VAKALARA GİT'}
              </button>

              <button
                onClick={handleLeaveTeam}
                style={{ width:'100%', marginTop:10, padding:'10px', background:'transparent', border:'1px solid rgba(255,59,59,0.3)', color:'#ff3b3b', fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:2, cursor:'pointer', transition:'all 0.2s' }}
                onMouseOver={e => e.target.style.background='rgba(255,59,59,0.08)'}
                onMouseOut={e => e.target.style.background='transparent'}
              >
                ✕ TAKIMDAN AYRIL
              </button>
            </div>

            {/* Sağ panel — sadece VM listesi, chat yok */}
            <div className="lobby-right">
              <div className="lobby-vms" style={{ padding: 20 }}>
                <div className="vms-header">AKTİF VM KÜMESİ</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                  Vakayı başlattığında VM'ler burada görünecek.
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent-green)', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, background: 'var(--accent-green)', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 6px var(--accent-green)' }} />
                  KÜME ÇEVRİMİÇİ
                </div>
              </div>
            </div>
          </div>
        </div>

        {kickTarget && (
          <ConfirmModal
            message={`"${kickTarget.username}" adlı kişiyi takımdan çıkarmak istediğinize emin misiniz?`}
            onConfirm={confirmKick}
            onCancel={() => setKickTarget(null)}
          />
        )}
      </>
    );
  }

  /* ── Takımda değil ── */
  if (view === 'team' && !myTeam) {
    return (
      <div className="lobby-simple">
        <div className="lobby-simple-header">
          <div className="lobby-simple-tag">// TAKIM_PROTOKOLÜ</div>
          <div className="lobby-simple-title">TAKIM MODU</div>
        </div>
        <div className="mode-grid">
          <div className="mode-card" onClick={() => setView('create')}>
            <div className="mode-icon">➕</div>
            <h2>TAKIM_KUR</h2>
            <p>Yeni bir takım oluştur, arkadaşlarını davet et</p>
          </div>
          <div className="mode-card" onClick={() => setView('join')}>
            <div className="mode-icon">🔑</div>
            <h2>TAKIMA_KATIL</h2>
            <p>Davet koduyla arkadaşının takımına gir</p>
          </div>
        </div>
        <button onClick={() => setView('mode')} className="btn btn-secondary" style={{ marginTop: 24 }}>← GERİ</button>
      </div>
    );
  }

  /* ── Takım oluştur ── */
  if (view === 'create') {
    return (
      <div className="lobby-simple">
        <div className="lobby-simple-header">
          <div className="lobby-simple-tag">// TAKIM_OLUŞTUR</div>
          <div className="lobby-simple-title">YENİ TAKIM</div>
        </div>
        <div className="lobby-form">
          <input type="text" placeholder="TAKIM ADI *" value={teamName} onChange={e => setTeamName(e.target.value)} maxLength={50} />
          <textarea placeholder="TAKIM AÇIKLAMASI (opsiyonel)" value={teamDescription} onChange={e => setTeamDescription(e.target.value)} rows={3} />
          <h3>UZMANLIĞINI SEÇ *</h3>
          <div className="roles-grid-small">
            {ROLES.map(r => (
              <div key={r.id} className={`role-card-small ${selectedRole === r.id ? 'selected' : ''}`} onClick={() => setSelectedRole(r.id)}>
                <span>{r.icon}</span>
                <span>{r.name}</span>
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button onClick={handleCreateTeam} className="btn btn-primary" disabled={loading}>
              {loading ? 'OLUŞTURULUYOR...' : '✓ TAKIMI OLUŞTUR'}
            </button>
            <button onClick={() => setView('team')} className="btn btn-secondary">İPTAL</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Takıma katıl ── */
  if (view === 'join') {
    return (
      <div className="lobby-simple">
        <div className="lobby-simple-header">
          <div className="lobby-simple-tag">// TAKIMA_KATIL</div>
          <div className="lobby-simple-title">
            {joinStep === 'code' ? 'DAVET KODU GİR' : 'ROL SEÇ'}
          </div>
        </div>
        <div className="lobby-form">

          {joinStep === 'code' ? (
            <>
              <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', marginBottom:16, letterSpacing:1 }}>
                6 HANELİ DAVET KODUNU GİR
              </p>
              <input
                type="text"
                className="invite-code-input"
                placeholder="ABC123"
                value={inviteCode}
                onChange={e => { setInviteCode(e.target.value.toUpperCase()); setJoinStep('code'); }}
                maxLength={6}
              />
              <div className="form-actions">
                <button onClick={handleCheckCode} className="btn btn-primary" disabled={loading || inviteCode.length !== 6}>
                  {loading ? 'KONTROL EDİLİYOR...' : '→ DEVAM ET'}
                </button>
                <button onClick={() => setView('team')} className="btn btn-secondary">İPTAL</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--accent-yellow)', letterSpacing:2, marginBottom:16, padding:'8px 12px', background:'rgba(245,197,24,0.06)', border:'1px solid rgba(245,197,24,0.15)' }}>
                KOD: {inviteCode} ✓
              </div>
              <h3>UZMANLIĞINI SEÇ *</h3>
              <div className="roles-grid-small">
                {ROLES.map(r => {
                  const taken = takenRolesForJoin.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      className={`role-card-small ${selectedRole === r.id ? 'selected' : ''} ${taken ? 'taken' : ''}`}
                      onClick={() => !taken && setSelectedRole(r.id)}
                      style={{ opacity: taken ? 0.35 : 1, cursor: taken ? 'not-allowed' : 'pointer', position:'relative' }}
                    >
                      <span>{r.icon}</span>
                      <span>{r.name}</span>
                      {taken && <span style={{ position:'absolute', top:4, right:6, fontFamily:'var(--font-mono)', fontSize:8, color:'#ff3b3b' }}>ALINDI</span>}
                    </div>
                  );
                })}
              </div>
              <div className="form-actions">
                <button onClick={handleJoinWithRole} className="btn btn-primary" disabled={loading || !selectedRole}>
                  {loading ? 'KATILINIYOR...' : '🔑 TAKIMA KATIL'}
                </button>
                <button onClick={() => { setJoinStep('code'); setSelectedRole(''); }} className="btn btn-secondary">← GERİ</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default Lobby;

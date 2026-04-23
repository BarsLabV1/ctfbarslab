import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import ConfirmModal from '../components/ConfirmModal';
import './Lobby.css';

const ROLES = [
  { id: 'OSINT',    name: 'OSINT',              icon: '🔍', description: 'Açık kaynak istihbaratı' },
  { id: 'Web',      name: 'Web Exploitation',    icon: '🌐', description: 'Web güvenlik açıkları'  },
  { id: 'Forensics',name: 'Forensics',           icon: '🔬', description: 'Dijital adli bilişim'   },
  { id: 'Crypto',   name: 'Cryptography',        icon: '🔐', description: 'Şifreleme ve kriptografi'},
  { id: 'Reverse',  name: 'Reverse Engineering', icon: '⚙️', description: 'Tersine mühendislik'   },
  { id: 'PWN',      name: 'Binary Exploitation', icon: '💣', description: 'Binary sömürü'          },
  { id: 'Network',  name: 'Network',             icon: '📡', description: 'Ağ güvenliği'           },
];

const Lobby = () => {
  const navigate   = useNavigate();
  const { caseId } = useParams(); // senaryo ID'si URL'den gelir
  const { showToast } = useToast();

  // null=loading, false=no team, object=team data
  const [myTeam,          setMyTeam]          = useState(null);
  const [view,            setView]            = useState('mode');   // mode | solo | team | create | join
  const [selectedRole,    setSelectedRole]    = useState('');
  const [teamName,        setTeamName]        = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [inviteCode,      setInviteCode]      = useState('');
  const [loading,         setLoading]         = useState(false);
  const [kickTarget,      setKickTarget]      = useState(null); // {userId, username}

  // Hedef URL: senaryo varsa play sayfası, yoksa cases
  const destination = caseId ? `/play/${caseId}` : '/cases';

  useEffect(() => { fetchMyTeam(); }, []); // eslint-disable-line

  const fetchMyTeam = async () => {
    try {
      const res = await api.get('/teams/my-team');
      if (res.data.hasTeam) {
        setMyTeam(res.data);
        setView('team'); // takıma girince direkt takım ekranına at
      } else {
        setMyTeam(false);
      }
    } catch {
      setMyTeam(false);
    }
  };

  // Takımda olsa bile solo başlayabilir
  const handleSoloStart = () => {
    if (!selectedRole) { showToast('Rol seçmelisiniz', 'warning'); return; }
    navigate(destination);
  };

  /* ── Actions ── */
  const handleCreateTeam = async () => {
    if (!teamName.trim()) { showToast('Takım adı gerekli', 'warning'); return; }
    if (!selectedRole)    { showToast('Rol seçmelisiniz', 'warning');  return; }
    setLoading(true);
    try {
      await api.post('/teams/create', {
        name: teamName.trim(),
        description: teamDescription.trim(),
        leaderRole: selectedRole,
      });
      showToast('Takım oluşturuldu!', 'success');
      await fetchMyTeam();
    } catch (err) {
      showToast(err.response?.data?.message || 'Takım oluşturulamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) { showToast('Davet kodu gerekli', 'warning'); return; }
    if (!selectedRole)      { showToast('Rol seçmelisiniz', 'warning');   return; }
    setLoading(true);
    try {
      const res = await api.post('/teams/join-by-code', {
        inviteCode: inviteCode.toUpperCase().trim(),
        role: selectedRole,
      });
      showToast(`${res.data.teamName} takımına katıldınız!`, 'success');
      await fetchMyTeam();
    } catch (err) {
      showToast(err.response?.data?.message || 'Takıma katılamadınız', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async (userId, username) => {
    setKickTarget({ userId, username });
  };

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
      navigator.clipboard.writeText(code)
        .then(() => showToast('Davet kodu kopyalandı!', 'success'))
        .catch(() => fallbackCopy(code));
    } else {
      fallbackCopy(code);
    }
  };

  const fallbackCopy = (text) => {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      document.execCommand('copy');
      showToast('Davet kodu kopyalandı!', 'success');
    } catch {
      showToast(`Kod: ${text}`, 'info');
    }
    document.body.removeChild(el);
  };

  /* ── Loading ── */
  if (myTeam === null) {
    return (
      <div className="lobby-container">
        <div className="lobby-loading"><div className="spinner" /><p>Yükleniyor...</p></div>
      </div>
    );
  }

  /* ── Mode selection: Solo or Team ── */
  if (view === 'mode') {
    return (
      <div className="lobby-container">
        <div className="lobby-header">
          <h1>🎮 Nasıl Oynamak İstiyorsun?</h1>
          {caseId && <p className="lobby-subtitle">Senaryo #{caseId}</p>}
          <button onClick={() => navigate(caseId ? `/cases/${caseId}` : '/cases')} className="btn btn-secondary" style={{marginTop:12}}>
            ← Geri
          </button>
        </div>
        <div className="mode-selection">
          <div className="mode-card" onClick={() => setView('solo')}>
            <div className="mode-icon">🎯</div>
            <h2>Solo Mod</h2>
            <p>Tek başına çöz, kendi hızında ilerle</p>
          </div>
          <div className="mode-card" onClick={() => setView('team')}>
            <div className="mode-icon">👥</div>
            <h2>Takım Modu</h2>
            <p>4 kişilik takım kur veya davet koduyla katıl</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Solo: pick role then go ── */
  if (view === 'solo') {
    return (
      <div className="lobby-container">
        <div className="lobby-header">
          <h1>🎯 Solo Mod</h1>
          <p>Rolünü seç ve başla!</p>
          <button onClick={() => setView('mode')} className="btn btn-secondary">← Geri</button>
        </div>
        <div className="role-selection">
          <h2>Rolünü Seç</h2>
          <div className="roles-grid">
            {ROLES.map(role => (
              <div
                key={role.id}
                className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                onClick={() => setSelectedRole(role.id)}
              >
                <div className="role-icon">{role.icon}</div>
                <h3>{role.name}</h3>
                <p>{role.description}</p>
              </div>
            ))}
          </div>
          {selectedRole && (
            <button onClick={handleSoloStart} className="btn btn-primary btn-large">
              🚀 Başla
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── Team view: already in team OR choose create/join ── */
  if (view === 'team') {
    // Zaten takımdaysa takım panelini göster
    if (myTeam) {
      return (
        <>
          <div className="lobby-container">
            <div className="lobby-header">
              <h1>👥 Takım Lobisi</h1>
              {caseId && <p className="lobby-subtitle">Senaryo #{caseId} için hazırlanıyorsunuz</p>}
              <button onClick={() => setView('mode')} className="btn btn-secondary" style={{marginTop:12}}>← Geri</button>
            </div>

            <div className="team-info-card">
              <h2>{myTeam.teamName}</h2>
              {myTeam.description && <p className="team-desc">{myTeam.description}</p>}

              <div className="team-stats">
                <span>⭐ {myTeam.totalScore} puan</span>
                <span>👥 {myTeam.members.length}/4 üye</span>
                <span className="my-role-badge">{myTeam.myRole}</span>
              </div>

              {myTeam.isLeader && (
                <div className="invite-code-section">
                  <h3>🔑 Davet Kodu</h3>
                  <div className="invite-code-box">
                    <span className="invite-code">{myTeam.inviteCode}</span>
                    <button onClick={copyInviteCode} className="btn btn-secondary btn-small">
                      📋 Kopyala
                    </button>
                  </div>
                  <p className="invite-hint">Bu kodu arkadaşlarınla paylaş, takıma katılsınlar</p>
                </div>
              )}

              <div className="team-members">
                <h3>Takım Üyeleri</h3>
                {myTeam.members.map((m, i) => (
                  <div key={i} className="member-card">
                    <div className="member-avatar">
                      {m.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <span className="member-name">
                        {m.username}
                        {m.isLeader && <span className="leader-tag">Lider</span>}
                      </span>
                      <span className="member-role">{m.role}</span>
                    </div>
                    {myTeam.isLeader && !m.isLeader && (
                      <button
                        className="kick-btn"
                        onClick={() => handleKick(m.userId, m.username)}
                      >
                        Çıkar
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={() => navigate(destination)} className="btn btn-primary btn-large">
                🚀 {caseId ? 'Senaryoya Başla' : 'Vakalara Git'}
              </button>
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

    // Takımda değilse oluştur/katıl seçimi
    return (
      <div className="lobby-container">
        <div className="lobby-header">
          <h1>👥 Takım Modu</h1>
          <button onClick={() => setView('mode')} className="btn btn-secondary">← Geri</button>
        </div>
        <div className="mode-selection">
          <div className="mode-card" onClick={() => setView('create')}>
            <div className="mode-icon">➕</div>
            <h2>Takım Oluştur</h2>
            <p>Yeni bir takım kur, arkadaşlarını davet et</p>
          </div>
          <div className="mode-card" onClick={() => setView('join')}>
            <div className="mode-icon">🔑</div>
            <h2>Takıma Katıl</h2>
            <p>Davet koduyla arkadaşının takımına gir</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Create team ── */
  if (view === 'create') {
    return (
      <div className="lobby-container">
        <div className="lobby-header">
          <h1>➕ Takım Oluştur</h1>
          <button onClick={() => setView('team')} className="btn btn-secondary">← Geri</button>
        </div>
        <div className="create-team-form card">
          <input
            type="text"
            placeholder="Takım Adı *"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            maxLength={50}
          />
          <textarea
            placeholder="Takım Açıklaması (opsiyonel)"
            value={teamDescription}
            onChange={e => setTeamDescription(e.target.value)}
            rows={3}
          />
          <h3>Rolünü Seç *</h3>
          <div className="roles-grid-small">
            {ROLES.map(role => (
              <div
                key={role.id}
                className={`role-card-small ${selectedRole === role.id ? 'selected' : ''}`}
                onClick={() => setSelectedRole(role.id)}
              >
                <span>{role.icon}</span>
                <span>{role.name}</span>
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button onClick={handleCreateTeam} className="btn btn-primary" disabled={loading}>
              {loading ? 'Oluşturuluyor...' : '✓ Takımı Oluştur'}
            </button>
            <button onClick={() => setView('team')} className="btn btn-secondary">İptal</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Join by code ── */
  if (view === 'join') {
    return (
      <div className="lobby-container">
        <div className="lobby-header">
          <h1>🔑 Takıma Katıl</h1>
          <button onClick={() => setView('team')} className="btn btn-secondary">← Geri</button>
        </div>
        <div className="join-by-code-form card">
          <p>Arkadaşından aldığın 6 haneli davet kodunu gir</p>
          <input
            type="text"
            placeholder="ABC123"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="invite-code-input"
          />
          <h3>Rolünü Seç *</h3>
          <div className="roles-grid-small">
            {ROLES.map(role => (
              <div
                key={role.id}
                className={`role-card-small ${selectedRole === role.id ? 'selected' : ''}`}
                onClick={() => setSelectedRole(role.id)}
              >
                <span>{role.icon}</span>
                <span>{role.name}</span>
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button onClick={handleJoinByCode} className="btn btn-success" disabled={loading}>
              {loading ? 'Katılınıyor...' : '🔑 Takıma Katıl'}
            </button>
            <button onClick={() => setView('team')} className="btn btn-secondary">İptal</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Lobby;

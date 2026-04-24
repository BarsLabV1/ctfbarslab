// Rol bazlı siber hacker SVG avatarları

const AVATARS = {
  // Mavi holografik yüz — varsayılan / OSINT
  default: (
    <svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
      <rect width="120" height="140" fill="#0a0e14"/>
      {/* Izgara */}
      <line x1="0" y1="70" x2="120" y2="70" stroke="#00d4ff" strokeWidth="0.3" opacity="0.3"/>
      <line x1="60" y1="0" x2="60" y2="140" stroke="#00d4ff" strokeWidth="0.3" opacity="0.3"/>
      {/* Kafa */}
      <ellipse cx="60" cy="55" rx="32" ry="38" fill="none" stroke="#00d4ff" strokeWidth="1.5" opacity="0.8"/>
      <ellipse cx="60" cy="55" rx="32" ry="38" fill="url(#faceGrad)" opacity="0.15"/>
      {/* Gözler */}
      <ellipse cx="46" cy="50" rx="7" ry="5" fill="#00d4ff" opacity="0.9"/>
      <ellipse cx="74" cy="50" rx="7" ry="5" fill="#00d4ff" opacity="0.9"/>
      <ellipse cx="46" cy="50" rx="3" ry="3" fill="#001a2e"/>
      <ellipse cx="74" cy="50" rx="3" ry="3" fill="#001a2e"/>
      {/* Göz parlaması */}
      <circle cx="48" cy="48" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="76" cy="48" r="1.5" fill="white" opacity="0.8"/>
      {/* Burun */}
      <path d="M57 58 L60 65 L63 58" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.6"/>
      {/* Ağız */}
      <path d="M48 72 Q60 78 72 72" fill="none" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7"/>
      {/* Boyun */}
      <rect x="52" y="90" width="16" height="20" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.5"/>
      {/* Omuzlar */}
      <path d="M20 130 Q30 110 52 108 L68 108 Q90 110 100 130" fill="none" stroke="#00d4ff" strokeWidth="1.5" opacity="0.6"/>
      {/* Tarama çizgileri */}
      <line x1="28" y1="30" x2="92" y2="30" stroke="#00d4ff" strokeWidth="0.5" opacity="0.2"/>
      <line x1="28" y1="35" x2="92" y2="35" stroke="#00d4ff" strokeWidth="0.5" opacity="0.15"/>
      <defs>
        <linearGradient id="faceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4ff"/>
          <stop offset="100%" stopColor="#001a2e"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // Kapüşonlu karanlık figür — Web/PWN
  hoodie: (
    <svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
      <rect width="120" height="140" fill="#080a0d"/>
      {/* Kapüşon */}
      <path d="M15 140 Q20 90 35 75 Q45 60 60 58 Q75 60 85 75 Q100 90 105 140Z" fill="#111520" stroke="#1a2030" strokeWidth="1"/>
      {/* Yüz gölgesi */}
      <ellipse cx="60" cy="72" rx="22" ry="26" fill="#0d1018"/>
      {/* Gözler — parlak */}
      <ellipse cx="50" cy="68" rx="5" ry="4" fill="#ff3b3b" opacity="0.9"/>
      <ellipse cx="70" cy="68" rx="5" ry="4" fill="#ff3b3b" opacity="0.9"/>
      <ellipse cx="50" cy="68" rx="2" ry="2" fill="#200000"/>
      <ellipse cx="70" cy="68" rx="2" ry="2" fill="#200000"/>
      {/* Maske çizgisi */}
      <path d="M38 80 Q60 85 82 80" fill="none" stroke="#1a2030" strokeWidth="1.5" opacity="0.8"/>
      {/* Kapüşon detayları */}
      <path d="M35 75 Q40 55 60 50 Q80 55 85 75" fill="none" stroke="#1a2030" strokeWidth="2" opacity="0.6"/>
      {/* Omuzlar */}
      <path d="M15 140 Q25 115 40 110 L80 110 Q95 115 105 140" fill="#0e1218" stroke="#1a2030" strokeWidth="1"/>
      {/* Glow efekti */}
      <ellipse cx="50" cy="68" rx="8" ry="6" fill="#ff3b3b" opacity="0.1"/>
      <ellipse cx="70" cy="68" rx="8" ry="6" fill="#ff3b3b" opacity="0.1"/>
    </svg>
  ),

  // Siber maske — Forensics/Crypto
  mask: (
    <svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
      <rect width="120" height="140" fill="#0a0c10"/>
      {/* Kafa */}
      <ellipse cx="60" cy="58" rx="30" ry="35" fill="#111820" stroke="#00ff88" strokeWidth="1" opacity="0.9"/>
      {/* Maske üst */}
      <path d="M32 50 Q60 42 88 50 L88 68 Q60 75 32 68Z" fill="#0d1a14" stroke="#00ff88" strokeWidth="1"/>
      {/* Göz delikleri */}
      <ellipse cx="46" cy="58" rx="9" ry="6" fill="#001a0d"/>
      <ellipse cx="74" cy="58" rx="9" ry="6" fill="#001a0d"/>
      {/* Göz ışıkları */}
      <ellipse cx="46" cy="58" rx="6" ry="4" fill="#00ff88" opacity="0.7"/>
      <ellipse cx="74" cy="58" rx="6" ry="4" fill="#00ff88" opacity="0.7"/>
      <ellipse cx="46" cy="58" rx="2.5" ry="2.5" fill="#001a0d"/>
      <ellipse cx="74" cy="58" rx="2.5" ry="2.5" fill="#001a0d"/>
      {/* Maske alt */}
      <path d="M35 68 Q60 80 85 68 L85 85 Q60 92 35 85Z" fill="#0d1a14" stroke="#00ff88" strokeWidth="0.8" opacity="0.7"/>
      {/* Nefes delikleri */}
      <circle cx="52" cy="76" r="2" fill="#00ff88" opacity="0.4"/>
      <circle cx="60" cy="76" r="2" fill="#00ff88" opacity="0.4"/>
      <circle cx="68" cy="76" r="2" fill="#00ff88" opacity="0.4"/>
      {/* Omuzlar */}
      <path d="M18 140 Q28 112 45 108 L75 108 Q92 112 102 140" fill="#111820" stroke="#00ff88" strokeWidth="0.8" opacity="0.5"/>
      {/* Devre çizgileri */}
      <line x1="88" y1="55" x2="105" y2="45" stroke="#00ff88" strokeWidth="0.8" opacity="0.4"/>
      <line x1="32" y1="55" x2="15" y2="45" stroke="#00ff88" strokeWidth="0.8" opacity="0.4"/>
      <circle cx="105" cy="45" r="2" fill="#00ff88" opacity="0.5"/>
      <circle cx="15" cy="45" r="2" fill="#00ff88" opacity="0.5"/>
    </svg>
  ),

  // Robot/AI kafa — Reverse/Network
  robot: (
    <svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
      <rect width="120" height="140" fill="#0a0c0f"/>
      {/* Kafa kutusu */}
      <rect x="28" y="25" width="64" height="72" rx="6" fill="#111520" stroke="#f5c518" strokeWidth="1.5"/>
      {/* Anten */}
      <line x1="60" y1="25" x2="60" y2="12" stroke="#f5c518" strokeWidth="1.5"/>
      <circle cx="60" cy="10" r="3" fill="#f5c518"/>
      {/* Gözler — ekran */}
      <rect x="36" y="42" width="18" height="14" rx="2" fill="#001a2e" stroke="#00d4ff" strokeWidth="1"/>
      <rect x="66" y="42" width="18" height="14" rx="2" fill="#001a2e" stroke="#00d4ff" strokeWidth="1"/>
      {/* Göz içi */}
      <rect x="40" y="46" width="10" height="6" rx="1" fill="#00d4ff" opacity="0.8"/>
      <rect x="70" y="46" width="10" height="6" rx="1" fill="#00d4ff" opacity="0.8"/>
      {/* Ağız — LED bar */}
      <rect x="38" y="72" width="44" height="8" rx="2" fill="#111520" stroke="#f5c518" strokeWidth="0.8"/>
      <rect x="40" y="74" width="8" height="4" rx="1" fill="#f5c518" opacity="0.9"/>
      <rect x="50" y="74" width="8" height="4" rx="1" fill="#f5c518" opacity="0.6"/>
      <rect x="60" y="74" width="8" height="4" rx="1" fill="#f5c518" opacity="0.8"/>
      <rect x="70" y="74" width="8" height="4" rx="1" fill="#f5c518" opacity="0.4"/>
      {/* Boyun */}
      <rect x="50" y="97" width="20" height="14" rx="2" fill="#111520" stroke="#f5c518" strokeWidth="1"/>
      {/* Omuzlar */}
      <path d="M15 140 L25 111 L45 108 L75 108 L95 111 L105 140Z" fill="#111520" stroke="#f5c518" strokeWidth="1"/>
      {/* Yan detaylar */}
      <circle cx="28" cy="55" r="4" fill="#f5c518" opacity="0.3"/>
      <circle cx="92" cy="55" r="4" fill="#f5c518" opacity="0.3"/>
    </svg>
  ),
};

// Role göre avatar seç
const getRoleAvatar = (role) => {
  const r = (role || '').toLowerCase();
  if (r.includes('web') || r.includes('pwn') || r.includes('binary')) return AVATARS.hoodie;
  if (r.includes('forensics') || r.includes('crypto')) return AVATARS.mask;
  if (r.includes('reverse') || r.includes('network')) return AVATARS.robot;
  return AVATARS.default; // OSINT, diğerleri
};

const HackerAvatar = ({ role, isYou = false, size = 80 }) => {
  const avatar = getRoleAvatar(role);
  return (
    <div style={{
      width: size, height: size,
      border: `1px solid ${isYou ? 'rgba(0,212,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: isYou ? '0 0 16px rgba(0,212,255,0.2)' : 'none',
    }}>
      {avatar}
    </div>
  );
};

export default HackerAvatar;

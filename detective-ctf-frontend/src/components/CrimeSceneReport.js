import React, { useState } from 'react';
import './CrimeSceneReport.css';

const today = new Date().toLocaleDateString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric' });

const TYPE_ICONS = { suspect:'🚨', evidence:'🔬', witness:'👁️', document:'📄', info:'📋' };
const TYPE_LABELS = { suspect:'ŞÜPHELİ PROFİLİ', evidence:'ADLİ BULGU', witness:'TANIK İFADESİ', document:'RESMİ BELGE', info:'BİLGİ NOTU' };
const DOC_COLORS = ['#f5f5dc','#f0ede0','#ede8d5','#e8e4d0','#f2eedf'];

/* ── Ana rapor kağıdı ── */
const MainReport = ({ caseData }) => (
  <div className="rp-paper" style={{ background: DOC_COLORS[0] }}>
    <div className="rp-official-stamp">
      <div className="rp-stamp-circle">
        <div className="rp-stamp-inner">
          <div>POLİS</div><div className="rp-stamp-star">★</div><div>DEPARTMANI</div>
        </div>
      </div>
    </div>
    <div className="rp-confidential">GİZLİ</div>

    <div className="rp-header">
      <div className="rp-badge">🛡️</div>
      <div>
        <h1>POLİS DEPARTMANI</h1>
        <h2>OLAY YERİ İNCELEME RAPORU</h2>
        <div className="rp-case-no">Vaka No: #{String(caseData.id).padStart(6,'0')}</div>
      </div>
    </div>

    <div className="rp-divider"/>

    <div className="rp-info-grid">
      {[
        ['Rapor Tarihi', today],
        ['Vaka Adı', caseData.title],
        ['Zorluk', `Seviye ${caseData.difficulty}/5`],
        ['Toplam Puan', `${caseData.totalPoints} puan`],
        ['Soru Sayısı', `${caseData.challengeCount || 0} adet`],
      ].map(([k,v]) => (
        <div key={k} className="rp-info-row">
          <span className="rp-info-label">{k}:</span>
          <span className="rp-info-value">{v}</span>
        </div>
      ))}
    </div>

    <div className="rp-divider"/>

    <div className="rp-section">
      <h3 className="rp-section-title">VAKA ÖZETİ</h3>
      <p className="rp-body-text">{caseData.story || caseData.description}</p>
    </div>

    <div className="rp-divider"/>

    <div className="rp-footer">
      <div className="rp-sig-block">
        <div className="rp-sig-name">J. Anderson</div>
        <div className="rp-sig-label">Baş Dedektif</div>
      </div>
      <div className="rp-sig-block">
        <div className="rp-sig-name">{today}</div>
        <div className="rp-sig-label">Tarih</div>
      </div>
    </div>

    <div className="rp-page-no">Sayfa 1</div>
    <div className="rp-texture"/>
  </div>
);

/* ── Çözülen soru belgesi ── */
const UnlockedDoc = ({ section, index }) => {
  const color = DOC_COLORS[(index + 1) % DOC_COLORS.length];
  const icon  = TYPE_ICONS[section.type]  || '📋';
  const label = TYPE_LABELS[section.type] || 'BELGE';

  return (
    <div className="rp-paper rp-unlocked-paper" style={{ background: color }}>
      <div className="rp-confidential">GİZLİ</div>

      <div className="rp-doc-type-banner">
        <span className={`rp-doc-type-badge rp-type-${section.type || 'info'}`}>
          {icon} {label}
        </span>
        <span className="rp-doc-unlock-info">
          🔓 {section.challengeTitle} çözüldü · {section.solvedAt}
        </span>
      </div>

      <div className="rp-divider"/>

      <div className="rp-doc-header">
        <h2 className="rp-doc-title">{section.title}</h2>
      </div>

      <div className="rp-section">
        <p className="rp-body-text">{section.content}</p>
      </div>

      <div className="rp-divider"/>

      <div className="rp-footer">
        <div className="rp-sig-block">
          <div className="rp-sig-name">J. Anderson</div>
          <div className="rp-sig-label">Düzenleyen</div>
        </div>
        <div className="rp-sig-block">
          <div className="rp-sig-name">{section.solvedAt}</div>
          <div className="rp-sig-label">Tarih</div>
        </div>
      </div>

      <div className="rp-page-no">Belge {index + 2}</div>
      <div className="rp-texture"/>
    </div>
  );
};

/* ══════════════════════════════════════════
   Ana component
══════════════════════════════════════════ */
const CrimeSceneReport = ({ caseData, unlockedSections = [] }) => {
  const [current, setCurrent] = useState(0);

  const docs = [
    { type: 'main' },
    ...unlockedSections,
  ];

  const total = docs.length;
  const prev  = () => setCurrent(c => Math.max(0, c - 1));
  const next  = () => setCurrent(c => Math.min(total - 1, c + 1));

  return (
    <div className="rp-container">

      {/* Sol ok */}
      <button
        className={`rp-side-btn rp-side-left ${current === 0 ? 'hidden' : ''}`}
        onClick={prev}
        title="Önceki belge"
      >
        ‹
      </button>

      <div className="rp-center">
        {/* Yığın */}
        <div className="rp-stack">
          {docs.map((doc, i) => {
            const offset   = i - current;
            if (Math.abs(offset) > 3) return null;
            const isActive  = offset === 0;
            const isBehind  = offset > 0;

            return (
              <div
                key={i}
                className={`rp-stack-item ${isActive ? 'active' : ''} ${isBehind ? 'behind' : ''}`}
                style={{
                  zIndex: total - Math.abs(offset),
                  transform: isBehind
                    ? `translateY(${offset * 7}px) translateX(${offset * 4}px) rotate(${offset * 0.8}deg) scale(${1 - offset * 0.025})`
                    : offset < 0
                    ? `translateY(${offset * 7}px) translateX(${offset * 4}px) scale(${1 + offset * 0.02})`
                    : 'none',
                  opacity: Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.18,
                }}
                onClick={isBehind ? next : undefined}
              >
                {doc.type === 'main'
                  ? <MainReport caseData={caseData} />
                  : <UnlockedDoc section={doc} index={i - 1} />
                }
              </div>
            );
          })}
        </div>

        {/* Dot nav + sayaç */}
        <div className="rp-nav">
          <div className="rp-nav-dots">
            {docs.map((doc, i) => (
              <button
                key={i}
                className={`rp-nav-dot ${i === current ? 'active' : ''}`}
                onClick={() => setCurrent(i)}
                title={i === 0 ? 'Ana Rapor' : `Belge ${i + 1}`}
              />
            ))}
          </div>
          <div className="rp-nav-counter">
            {current + 1} / {total}
            {current > 0 && (
              <span className="rp-nav-label">
                {TYPE_LABELS[docs[current].type] || 'BELGE'}
              </span>
            )}
          </div>
        </div>

        {unlockedSections.length === 0 && (
          <p className="rp-hint">Soruları çözdükçe yeni belgeler burada belirecek</p>
        )}
      </div>

      {/* Sağ ok */}
      <button
        className={`rp-side-btn rp-side-right ${current === total - 1 ? 'hidden' : ''}`}
        onClick={next}
        title="Sonraki belge"
      >
        ›
      </button>

    </div>
  );
};

export default CrimeSceneReport;

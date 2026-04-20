import React from 'react';
import './CrimeSceneReport.css';

const CrimeSceneReport = ({ caseData, clue }) => {
  const today = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="report-container">
      <div className="report-paper">
        {/* Resmi Damga */}
        <div className="official-stamp">
          <div className="stamp-circle">
            <div className="stamp-text">
              <div>POLİS</div>
              <div className="stamp-center">★</div>
              <div>DEPARTMANI</div>
            </div>
          </div>
        </div>

        {/* Gizli Damga */}
        <div className="confidential-stamp">GİZLİ</div>

        {/* Başlık */}
        <div className="report-header">
          <div className="header-logo">
            <div className="badge-icon">🛡️</div>
          </div>
          <div className="header-text">
            <h1>POLİS DEPARTMANI</h1>
            <h2>OLAY YERİ İNCELEME RAPORU</h2>
            <div className="case-number">Vaka No: #{caseData.id.toString().padStart(6, '0')}</div>
          </div>
        </div>

        <div className="report-divider"></div>

        {/* Rapor Bilgileri */}
        <div className="report-info-grid">
          <div className="info-row">
            <span className="info-label">Rapor Tarihi:</span>
            <span className="info-value">{today}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Vaka Adı:</span>
            <span className="info-value">{caseData.title}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Zorluk Seviyesi:</span>
            <span className="info-value">Seviye {caseData.difficulty}/5</span>
          </div>
          <div className="info-row">
            <span className="info-label">Toplam Puan:</span>
            <span className="info-value">{caseData.totalPoints} puan</span>
          </div>
          <div className="info-row">
            <span className="info-label">Challenge Sayısı:</span>
            <span className="info-value">{caseData.challengeCount || 0} adet</span>
          </div>
        </div>

        <div className="report-divider"></div>

        {/* Vaka Özeti */}
        <div className="report-section">
          <h3 className="section-title">VAKA ÖZETİ</h3>
          <div className="section-content">
            <p className="typewriter-text">{caseData.story}</p>
          </div>
        </div>

        {/* Olay Yeri Bulguları */}
        <div className="report-section">
          <h3 className="section-title">VAKA ÖZETİ VE BULGULAR</h3>
          <div className="section-content">
            {caseData.availableClues && caseData.availableClues.length > 0 ? (
              caseData.availableClues.map((clue, index) => (
                <div key={clue.id} className="finding-item">
                  <div className="finding-number">[{index + 1}]</div>
                  <div className="finding-content">
                    <div className="finding-title">{clue.title}</div>
                    <div className="finding-description">{clue.content}</div>
                  </div>
                </div>
              ))
            ) : (
              <p>Challenge'ları çözerek ipuçlarını keşfedin.</p>
            )}
          </div>
        </div>

        {/* Challenge Tablosu */}
        <div className="report-section">
          <h3 className="section-title">CHALLENGE KAYIT TABLOSU</h3>
          <div className="section-content">
            <p>Bu vaka {caseData.challengeCount || 0} adet challenge içermektedir.</p>
            <p>Challenge'ları çözmek için vaka detay sayfasından challenge listesine erişebilirsiniz.</p>
          </div>
        </div>

        <div className="report-divider"></div>

        {/* Alt Bilgi */}
        <div className="report-footer">
          <div className="footer-section">
            <div className="signature-line">
              <div className="signature-text">Baş Dedektif</div>
              <div className="signature">J. Anderson</div>
            </div>
          </div>
          <div className="footer-section">
            <div className="signature-line">
              <div className="signature-text">Tarih</div>
              <div className="signature">{today}</div>
            </div>
          </div>
        </div>

        {/* Sayfa Numarası */}
        <div className="page-number">Sayfa 1/1</div>

        {/* Kağıt Dokusu */}
        <div className="paper-texture"></div>
      </div>
    </div>
  );
};

export default CrimeSceneReport;

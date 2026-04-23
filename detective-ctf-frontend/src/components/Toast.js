import React, { useEffect, useState } from 'react';
import './Toast.css';

const TYPE_META = {
  success: { title: 'Başarılı', icon: '✓' },
  error:   { title: 'Hata',     icon: '✕' },
  warning: { title: 'Uyarı',    icon: '!' },
  info:    { title: 'Bilgi',    icon: 'i' },
};

const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
  const [hiding, setHiding] = useState(false);
  const meta = TYPE_META[type] || TYPE_META.info;

  const dismiss = () => {
    setHiding(true);
    setTimeout(onClose, 250);
  };

  useEffect(() => {
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`toast toast-${type}${hiding ? ' hiding' : ''}`}
      style={{ position: 'relative', overflow: 'hidden', pointerEvents: 'all' }}
    >
      <div className="toast-icon-wrap">{meta.icon}</div>

      <div className="toast-body">
        <div className="toast-title">{meta.title}</div>
        <div className="toast-message">{message}</div>
      </div>

      <button className="toast-close" onClick={dismiss} aria-label="Kapat">
        ×
      </button>

      <div
        className="toast-progress"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
};

export default Toast;

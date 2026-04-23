import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn-cancel" onClick={onCancel}>İptal</button>
          <button className="confirm-btn-ok" onClick={onConfirm}>Çıkar</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

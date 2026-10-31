import React, { useState } from 'react';
import { FaXmark, FaFloppyDisk, FaCloud, FaCircleInfo } from 'react-icons/fa6';
import { SUPABASE_URL, getStoredAnonKey, setStoredAnonKey, resetSupabaseClient } from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [anonKey, setAnonKey] = useState(getStoredAnonKey());

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredAnonKey(anonKey.trim());
    resetSupabaseClient();
    onConfigSaved();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaCloud style={{ color: '#4f46e5' }} />
            Configurazione Supabase Database
          </h2>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <FaXmark />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSave}>
          <div className="form-group">
            <label>URL Database Supabase:</label>
            <input
              type="text"
              className="form-input"
              value={SUPABASE_URL}
              disabled
              style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="anonKeyInput">Chiave Anon Public (Project API Key):</label>
            <input
              type="text"
              id="anonKeyInput"
              className="form-input"
              placeholder="Incolla la tua anon key (es. eyJhbGci...)"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              autoFocus
            />
          </div>

          <div
            style={{
              fontSize: '0.82rem',
              color: '#475569',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '10px 12px',
              borderRadius: '8px',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
            }}
          >
            <FaCircleInfo style={{ color: '#6366f1', marginTop: '2px', flexShrink: 0 }} />
            <span>
              Trovi questa chiave su <strong>supabase.com</strong> nel tuo progetto in{' '}
              <strong>Project Settings</strong> (icona ingranaggio) ➔ <strong>API</strong> ➔{' '}
              <strong>Project API keys (anon public)</strong>.
            </span>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annulla
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FaFloppyDisk />
              <span>Salva Configurazione</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

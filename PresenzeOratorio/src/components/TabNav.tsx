import React from 'react';
import { FaClipboardUser, FaTrophy } from 'react-icons/fa6';

interface TabNavProps {
  currentTab: 'presenze' | 'squadre';
  onTabChange: (tab: 'presenze' | 'squadre') => void;
}

export const TabNav: React.FC<TabNavProps> = ({ currentTab, onTabChange }) => {
  return (
    <nav className="tab-nav">
      <button
        id="tabPresenze"
        className={`tab-btn ${currentTab === 'presenze' ? 'active' : ''}`}
        onClick={() => onTabChange('presenze')}
      >
        <FaClipboardUser />
        <span>Appello</span>
      </button>

      <button
        id="tabSquadre"
        className={`tab-btn ${currentTab === 'squadre' ? 'active' : ''}`}
        onClick={() => onTabChange('squadre')}
      >
        <FaTrophy />
        <span>Generatore Squadre</span>
      </button>
    </nav>
  );
};

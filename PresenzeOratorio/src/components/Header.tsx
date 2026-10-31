import React from 'react';
import {
  FaChurch,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarDay,
  FaCloud,
} from 'react-icons/fa6';

interface HeaderProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  onShiftDate: (delta: number) => void;
  onSetToday: () => void;
  isCloudConnected: boolean;
  onOpenCloudConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  onShiftDate,
  onSetToday,
  isCloudConnected,
  onOpenCloudConfig,
}) => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-icon">
          <FaChurch />
        </div>
        <div>
          <h1 className="main-title">Registro Presenze</h1>
          <p className="sub-title">Catechismo • Doposcuola • Attività in Oratorio</p>
        </div>
      </div>

      <div className="header-date">
        <button
          id="btnSupabaseConfig"
          onClick={onOpenCloudConfig}
          className="date-btn"
          title="Configura connessione Supabase Cloud"
        >
          <FaCloud />
          <span id="supabaseStatus">
            {isCloudConnected ? 'Cloud Connesso' : 'Connetti Cloud'}
          </span>
        </button>

        <button
          onClick={() => onShiftDate(-1)}
          className="date-btn"
          title="Giorno precedente"
        >
          <FaChevronLeft />
        </button>

        <button
          onClick={onSetToday}
          className="date-btn"
          title="Vai a oggi"
        >
          <FaCalendarDay style={{ marginRight: '4px' }} />
          Oggi
        </button>

        <label htmlFor="dataPicker">Data:</label>
        <input
          type="date"
          id="dataPicker"
          className="date-input"
          value={currentDate}
          onChange={(e) => onDateChange(e.target.value)}
        />

        <button
          onClick={() => onShiftDate(1)}
          className="date-btn"
          title="Giorno successivo"
        >
          <FaChevronRight />
        </button>
      </div>
    </header>
  );
};

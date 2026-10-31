import React from 'react';
import {
  FaBookOpen,
  FaVolleyball,
  FaCross,
  FaRightLeft,
  FaCheckDouble,
  FaClipboardCheck,
  FaFileExcel,
  FaPrint,
  FaUserPlus,
} from 'react-icons/fa6';
import type { Anno } from '../types';
import { ANNO_LABELS } from '../constants';

interface FiltersAndCountersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedRole: string;
  onRoleChange: (val: string) => void;
  selectedCatechismo: string;
  onCatechismoChange: (val: string) => void;
  selectedAnno: string;
  onAnnoChange: (val: string) => void;
  onOpenNewPersonModal: () => void;
  countCatechismo: number;
  countOratorio: number;
  countMessa: number;
  onCopyCatechismoToOratorio: () => void;
  onMarkAllCatechismo: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
}

export const FiltersAndCounters: React.FC<FiltersAndCountersProps> = ({
  searchQuery,
  onSearchChange,
  selectedRole,
  onRoleChange,
  selectedCatechismo,
  onCatechismoChange,
  selectedAnno,
  onAnnoChange,
  onOpenNewPersonModal,
  countCatechismo,
  countOratorio,
  countMessa,
  onCopyCatechismoToOratorio,
  onMarkAllCatechismo,
  onExportCSV,
  onPrint,
}) => {
  return (
    <section className="filters-section">
      <div className="filters-row">
        <input
          type="text"
          id="searchInput"
          className="search-input"
          placeholder="Cerca Nome, Cognome, Note, Allergie..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <select
          id="filterRole"
          className="filter-select"
          value={selectedRole}
          onChange={(e) => onRoleChange(e.target.value)}
        >
          <option value="">Tutti i ruoli</option>
          <option value="Bambino">Bambino</option>
          <option value="Animatore">Animatore</option>
        </select>

        <select
          id="filterCatechismo"
          className="filter-select"
          value={selectedCatechismo}
          onChange={(e) => onCatechismoChange(e.target.value)}
        >
          <option value="">Tutti gli Iscritti</option>
          <option value="si">Solo Iscritti a Catechismo</option>
          <option value="no">Solo Oratorio (No Catechismo)</option>
        </select>

        <select
          id="filterAnno"
          className="filter-select"
          value={selectedAnno}
          onChange={(e) => onAnnoChange(e.target.value)}
        >
          <option value="">Tutti gli anni</option>
          {(Object.keys(ANNO_LABELS) as Anno[]).map((annoKey) => (
            <option key={annoKey} value={annoKey}>
              {ANNO_LABELS[annoKey]}
            </option>
          ))}
        </select>

        <button
          id="newPerson"
          className="btn-success"
          title="Aggiungi Nuovo Iscritto"
          onClick={onOpenNewPersonModal}
        >
          <FaUserPlus />
          <span>+</span>
        </button>
      </div>

      {/* Griglia Contatori */}
      <div className="counters-grid">
        <div className="counter-card card-catechismo">
          <span className="counter-title">
            <FaBookOpen /> Catechismo
          </span>
          <span id="countCatechismo" className="counter-number">
            {countCatechismo}
          </span>
          <span className="counter-subtitle">presenti a lezione</span>
        </div>

        <div className="counter-card card-oratorio">
          <span className="counter-title">
            <FaVolleyball /> Oratorio
          </span>
          <span id="countOratorio" className="counter-number">
            {countOratorio}
          </span>
          <span className="counter-subtitle">fermati per i giochi</span>
        </div>

        <div className="counter-card card-messa">
          <span className="counter-title">
            <FaCross /> Messa
          </span>
          <span id="countMessa" className="counter-number">
            {countMessa}
          </span>
          <span className="counter-subtitle">hanno partecipato</span>
        </div>
      </div>

      {/* Azioni Rapide Passaggio Catechismo -> Oratorio */}
      <div className="quick-actions-bar">
        <div className="quick-action-info">
          <div className="quick-action-icon">
            <FaRightLeft />
          </div>
          <div className="quick-action-text">
            <strong>Passaggio Catechismo - Oratorio</strong>
            <span>I ragazzi presenti a catechismo si fermano in cortile? Segnali con un clic:</span>
          </div>
        </div>

        <div className="quick-action-buttons">
          <button
            id="btnPassaggioOratorio"
            className="btn-action-oratorio"
            title="Segna tutti i presenti a catechismo come presenti in oratorio"
            onClick={onCopyCatechismoToOratorio}
          >
            <FaCheckDouble />
            <span>Fermali tutti in Oratorio</span>
          </button>

          <button
            id="btnTuttiPresentiCatechismo"
            className="btn-action-catechismo"
            title="Segna presenti a catechismo per gli iscritti visibili"
            onClick={onMarkAllCatechismo}
          >
            <FaClipboardCheck />
            <span>Tutti a Catechismo</span>
          </button>

          <button
            id="btnExportCSV"
            className="btn-action-secondary"
            title="Scarica foglio presenze in formato Excel/CSV"
            onClick={onExportCSV}
          >
            <FaFileExcel />
            <span>Esporta CSV</span>
          </button>

          <button
            id="btnPrint"
            className="btn-action-secondary"
            title="Stampa registro cartaceo"
            onClick={onPrint}
          >
            <FaPrint />
            <span>Stampa</span>
          </button>
        </div>
      </div>
    </section>
  );
};

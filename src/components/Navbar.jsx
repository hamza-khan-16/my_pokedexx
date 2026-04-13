import React from 'react'
import { Link } from 'react-router-dom'

const REGIONS = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea'];

const TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

const TYPE_COLORS = {
  Fire: '#f4631e', Water: '#4d90d5', Grass: '#5fbd58', Electric: '#f3d23b',
  Ice: '#74cec0', Fighting: '#cf3f6c', Poison: '#a864c7', Ground: '#d97845',
  Flying: '#8fa8dd', Psychic: '#f97176', Bug: '#90c12c', Rock: '#c5b78c',
  Ghost: '#5269ad', Dragon: '#0b6dc3', Dark: '#5a5366', Steel: '#5a8ea2',
  Fairy: '#ef70ef', Normal: '#9099a1',
};

export default function Navbar({ onRegionSelect, onTypeSelect, onClearFilter, activeFilter }) {
  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid">
        <Link
          className="navbar-brand"
          to="/"
          onClick={() => onClearFilter && onClearFilter()}
        >
          <img
            style={{ marginBottom: '5px', marginRight: '6px' }}
            src="/pokeball.png"
            width="28"
            height="28"
            alt="Pokédex"
          />
          Pokédex
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                id="regionsDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {activeFilter?.kind === 'region' ? `📍 ${activeFilter.label}` : 'Regions'}
              </a>
              <ul className="dropdown-menu" aria-labelledby="regionsDropdown">
                {REGIONS.map(region => (
                  <li key={region}>
                    <a
                      className={`dropdown-item dropdown-hover ${activeFilter?.label === region ? 'active-filter' : ''}`}
                      href="#"
                      onClick={(e) => { e.preventDefault(); onRegionSelect && onRegionSelect(region); }}
                    >
                      {region}
                    </a>
                  </li>
                ))}
              </ul>
            </li>

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                id="typesDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {activeFilter?.kind === 'type' ? `⚡ ${activeFilter.label}` : 'Types'}
              </a>
              <ul className="dropdown-menu types-dropdown" aria-labelledby="typesDropdown">
                {TYPES.map(type => (
                  <li key={type}>
                    <a
                      className={`dropdown-item dropdown-hover ${activeFilter?.label === type ? 'active-filter' : ''}`}
                      href="#"
                      onClick={(e) => { e.preventDefault(); onTypeSelect && onTypeSelect(type); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <span
                        className="type-dot"
                        style={{ backgroundColor: TYPE_COLORS[type] }}
                      />
                      {type}
                    </a>
                  </li>
                ))}
              </ul>
            </li>

            {activeFilter?.kind !== 'all' && (
              <li className="nav-item">
                <a
                  className="nav-link clear-filter"
                  href="#"
                  onClick={(e) => { e.preventDefault(); onClearFilter && onClearFilter(); }}
                >
                  ✕ Clear filter
                </a>
              </li>
            )}

          </ul>
        </div>
      </div>
    </nav>
  );
}

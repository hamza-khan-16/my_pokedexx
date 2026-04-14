import React, { useState } from 'react'
import { Link } from "react-router-dom";

const TYPE_COLORS = {
  fire: '#f4631e', water: '#4d90d5', grass: '#5fbd58', electric: '#f3d23b',
  ice: '#74cec0', fighting: '#cf3f6c', poison: '#a864c7', ground: '#d97845',
  flying: '#8fa8dd', psychic: '#f97176', bug: '#90c12c', rock: '#c5b78c',
  ghost: '#5269ad', dragon: '#0b6dc3', dark: '#5a5366', steel: '#5a8ea2',
  fairy: '#ef70ef', normal: '#9099a1',
};

export default function Card({ index, title, imageUrl, types }) {
  const [imgError, setImgError] = useState(false);
  const primaryColor = TYPE_COLORS[types?.[0]?.type?.name] || '#9099a1';

  return (
    <div className="poke-card">
      <div className="poke-card-image-wrapper">
        <span className="poke-card-number">#{String(index).padStart(3, '0')}</span>

        {!imgError && imageUrl ? (
          <img
            src={imageUrl}
            className="poke-card-image"
            alt={title}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="card-pokeball-placeholder">
            <div
              className="card-pb-ball"
              style={{ background: `linear-gradient(to bottom, ${primaryColor} 50%, #fff 50%)` }}
            >
              <div className="card-pb-band" />
              <div className="card-pb-center" />
            </div>
          </div>
        )}
      </div>

      <div className="poke-card-body">
        <h5 className="poke-card-name">{title}</h5>
        <div className="poke-card-types">
          {types && types.map((t) => (
            <span
              key={t.type.name}
              className="type-badge"
              style={{ backgroundColor: TYPE_COLORS[t.type.name] || '#777' }}
            >
              {t.type.name}
            </span>
          ))}
        </div>
        <Link to={`/pokemon/${index}`} className="poke-card-link">View Details</Link>
      </div>
    </div>
  );
}

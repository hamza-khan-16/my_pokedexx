import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./pokesdetails.css";
import loader from './assets/enhanced_circle.png';

const TYPE_COLORS = {
  fire: '#f4631e', water: '#4d90d5', grass: '#5fbd58', electric: '#f3d23b',
  ice: '#74cec0', fighting: '#cf3f6c', poison: '#a864c7', ground: '#d97845',
  flying: '#8fa8dd', psychic: '#f97176', bug: '#90c12c', rock: '#c5b78c',
  ghost: '#5269ad', dragon: '#0b6dc3', dark: '#5a5366', steel: '#5a8ea2',
  fairy: '#ef70ef', normal: '#9099a1',
};

const STAT_COLORS = {
  hp: '#ff5959', attack: '#f5ac78', defense: '#fae078',
  'special-attack': '#9db7f5', 'special-defense': '#a7db8d', speed: '#fa92b2',
};

function getIdFromUrl(url) {
  return url.split('/').filter(Boolean).pop();
}

function getDescription(speciesData) {
  if (!speciesData?.flavor_text_entries) return null;
  const entry = speciesData.flavor_text_entries.find(e => e.language.name === 'en');
  if (!entry) return null;
  return entry.flavor_text.replace(/\f/g, ' ').replace(/\u00ad\n/g, '').replace(/\n/g, ' ').trim();
}

function parseEvolutionChain(chain) {
  const stages = [];
  const traverse = (node, depth) => {
    if (!stages[depth]) stages[depth] = [];
    stages[depth].push({ name: node.species.name, id: getIdFromUrl(node.species.url) });
    node.evolves_to.forEach(next => traverse(next, depth + 1));
  };
  traverse(chain, 0);
  return stages;
}

function GenderBar({ genderRate }) {
  if (genderRate === -1) return <span className="info-value">Genderless</span>;
  const femalePct = (genderRate / 8) * 100;
  const malePct = 100 - femalePct;
  return (
    <div className="gender-bar-wrap">
      <span className="gender-m">♂ {malePct}%</span>
      <div className="gender-bar">
        {malePct > 0 && <div className="gender-bar-male" style={{ width: `${malePct}%` }} />}
        {femalePct > 0 && <div className="gender-bar-female" style={{ width: `${femalePct}%` }} />}
      </div>
      <span className="gender-f">♀ {femalePct}%</span>
    </div>
  );
}

const PokemonDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pokemon, setPokemon] = useState(null);
  const [species, setSpecies] = useState(null);
  const [evolution, setEvolution] = useState(null);
  const [loading, setloading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95; utter.pitch = 1.05;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  useEffect(() => { return () => { window.speechSynthesis?.cancel(); setIsSpeaking(false); }; }, [id]);

  useEffect(() => {
    setloading(true); setPokemon(null); setSpecies(null); setEvolution(null);
    window.speechSynthesis?.cancel();

    const fetchAll = async () => {
      try {
        const [pokeRes, speciesRes] = await Promise.all([
          fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
          fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
        ]);
        const pokeData = await pokeRes.json();
        const speciesData = await speciesRes.json();
        setPokemon(pokeData);
        setSpecies(speciesData);
        setloading(false);

        const desc = getDescription(speciesData);
        if (desc) speak(`${pokeData.name}. ${desc}`);

        if (speciesData.evolution_chain?.url) {
          const evoRes = await fetch(speciesData.evolution_chain.url);
          const evoData = await evoRes.json();
          setEvolution(parseEvolutionChain(evoData.chain));
        }
      } catch (err) {
        console.error(err); setloading(false);
      }
    };
    fetchAll();
  }, [id, speak]);

  const handleSpeakToggle = () => {
    const desc = getDescription(species);
    if (!desc) return;
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
    else speak(`${pokemon.name}. ${desc}`);
  };

  if (loading) {
    return (
      <div className="loader-container">
        <img src={loader} alt="Loading..." className="loader" />
        <p className="loader-text">Loading...</p>
      </div>
    );
  }

  const primaryType = pokemon?.types?.[0]?.type?.name || 'normal';
  const primaryColor = TYPE_COLORS[primaryType] || '#9099a1';
  const heightM = (pokemon.height / 10).toFixed(1);
  const weightKg = (pokemon.weight / 10).toFixed(1);
  const description = getDescription(species);
  const genName = species?.generation?.name?.replace('generation-', 'Gen ').toUpperCase() || '—';
  const catchRate = species?.capture_rate ?? '—';
  const friendship = species?.base_happiness ?? '—';
  const growthRate = species?.growth_rate?.name?.replace(/-/g, ' ') || '—';
  const eggGroups = species?.egg_groups?.map(e => e.name).join(', ') || '—';
  const hatchSteps = species?.hatch_counter ? (species.hatch_counter + 1) * 255 : '—';
  const habitat = species?.habitat?.name?.replace(/-/g, ' ') || 'Unknown';
  const isLegendary = species?.is_legendary;
  const isMythical = species?.is_mythical;
  const baseExp = pokemon?.base_experience ?? '—';

  const shinySprite = pokemon?.sprites?.other?.['official-artwork']?.front_shiny;
  const sprites = [
    { label: 'Default', src: pokemon?.sprites?.front_default },
    { label: 'Shiny', src: pokemon?.sprites?.front_shiny },
    { label: 'Back', src: pokemon?.sprites?.back_default },
    { label: 'Back Shiny', src: pokemon?.sprites?.back_shiny },
  ].filter(s => s.src);

  const heldItems = pokemon?.held_items || [];
  const gameIndices = pokemon?.game_indices?.map(g => g.version.name) || [];

  return (
    <div className="detail-page">

      {/* ── Left Panel ── */}
      <div className="detail-left" style={{ background: `linear-gradient(160deg, ${primaryColor}33 0%, #0f0f1a 60%)` }}>
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

        <div className="detail-number">#{String(pokemon.id).padStart(3, '0')}</div>

        <img
          className="detail-artwork"
          src={pokemon?.sprites?.other?.['official-artwork']?.front_default || pokemon?.sprites?.front_default || './default.jpg'}
          alt={pokemon.name}
        />

        <h1 className="detail-name">{pokemon.name}</h1>

        <div className="detail-types">
          {pokemon.types.map(t => (
            <span key={t.type.name} className="detail-type-badge" style={{ backgroundColor: TYPE_COLORS[t.type.name] || '#777' }}>
              {t.type.name}
            </span>
          ))}
        </div>

        {(isLegendary || isMythical) && (
          <div className="special-badge">
            {isMythical ? '✨ Mythical' : '⭐ Legendary'}
          </div>
        )}

        <div className="detail-meta">
          <div className="detail-meta-item">
            <span className="meta-label">Height</span>
            <span className="meta-value">{heightM} m</span>
          </div>
          <div className="detail-meta-divider" />
          <div className="detail-meta-item">
            <span className="meta-label">Weight</span>
            <span className="meta-value">{weightKg} kg</span>
          </div>
          <div className="detail-meta-divider" />
          <div className="detail-meta-item">
            <span className="meta-label">Gen</span>
            <span className="meta-value">{genName}</span>
          </div>
        </div>

        {description && (
          <div className="detail-description">
            <div className="description-header">
              <span className="description-label">Pokédex Entry</span>
              <button className={`speak-btn ${isSpeaking ? 'speaking' : ''}`} onClick={handleSpeakToggle} title={isSpeaking ? 'Stop' : 'Read aloud'}>
                {isSpeaking ? (
                  <span className="speak-waves"><span /><span /><span /></span>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                )}
              </button>
            </div>
            <p className="description-text">{description}</p>
          </div>
        )}

        {shinySprite && (
          <div className="shiny-preview">
            <span className="shiny-label">✨ Shiny</span>
            <img src={shinySprite} alt="Shiny" className="shiny-img" />
          </div>
        )}
      </div>

      {/* ── Right Panel ── */}
      <div className="detail-right">

        {/* Abilities */}
        <section className="detail-section">
          <h2 className="section-title">Abilities</h2>
          <div className="ability-list">
            {pokemon.abilities.map(a => (
              <span key={a.ability.name} className={`ability-badge ${a.is_hidden ? 'hidden' : ''}`}>
                {a.ability.name}{a.is_hidden && <em> (hidden)</em>}
              </span>
            ))}
          </div>
        </section>

        {/* Training */}
        <section className="detail-section">
          <h2 className="section-title">Training</h2>
          <div className="info-grid">
            <div className="info-row"><span className="info-label">Base EXP</span><span className="info-value">{baseExp}</span></div>
            <div className="info-row"><span className="info-label">Catch Rate</span><span className="info-value">{catchRate} / 255</span></div>
            <div className="info-row"><span className="info-label">Base Friendship</span><span className="info-value">{friendship}</span></div>
            <div className="info-row"><span className="info-label">Growth Rate</span><span className="info-value capitalize">{growthRate}</span></div>
            <div className="info-row"><span className="info-label">Habitat</span><span className="info-value capitalize">{habitat}</span></div>
          </div>
        </section>

        {/* Breeding */}
        <section className="detail-section">
          <h2 className="section-title">Breeding</h2>
          <div className="info-grid">
            <div className="info-row"><span className="info-label">Egg Groups</span><span className="info-value capitalize">{eggGroups}</span></div>
            <div className="info-row">
              <span className="info-label">Gender</span>
              <GenderBar genderRate={species?.gender_rate ?? -1} />
            </div>
            <div className="info-row"><span className="info-label">Hatch Steps</span><span className="info-value">{hatchSteps.toLocaleString?.() ?? hatchSteps}</span></div>
          </div>
        </section>

        {/* Base Stats */}
        <section className="detail-section">
          <h2 className="section-title">Base Stats</h2>
          <div className="stats-grid">
            {pokemon.stats.map(s => {
              const pct = Math.min(Math.round((s.base_stat / 255) * 100), 100);
              const color = STAT_COLORS[s.stat.name] || '#aaa';
              return (
                <div key={s.stat.name} className="stat-row">
                  <span className="stat-label">{s.stat.name}</span>
                  <span className="stat-value" style={{ color }}>{s.base_stat}</span>
                  <div className="stat-bar-bg">
                    <div className="stat-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
            <div className="stat-row total-row">
              <span className="stat-label">Total</span>
              <span className="stat-value total-value">{pokemon.stats.reduce((a, s) => a + s.base_stat, 0)}</span>
              <div className="stat-bar-bg" />
            </div>
          </div>
        </section>

        {/* Evolution Chain */}
        {evolution && evolution.length > 1 && (
          <section className="detail-section">
            <h2 className="section-title">Evolution Chain</h2>
            <div className="evo-chain">
              {evolution.map((stage, si) => (
                <React.Fragment key={si}>
                  {si > 0 && <div className="evo-arrow">→</div>}
                  <div className="evo-stage">
                    {stage.map(poke => (
                      <Link key={poke.name} to={`/pokemon/${poke.id}`} className={`evo-card ${poke.id === String(id) ? 'evo-current' : ''}`}>
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${poke.id}.png`}
                          alt={poke.name}
                          className="evo-img"
                          onError={e => { e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.id}.png`; }}
                        />
                        <span className="evo-name">{poke.name}</span>
                        <span className="evo-num">#{String(poke.id).padStart(3, '0')}</span>
                      </Link>
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </section>
        )}

        {/* Sprite Gallery */}
        {sprites.length > 0 && (
          <section className="detail-section">
            <h2 className="section-title">Sprites</h2>
            <div className="sprite-gallery">
              {sprites.map(s => (
                <div key={s.label} className="sprite-item">
                  <img src={s.src} alt={s.label} className="sprite-img" />
                  <span className="sprite-label">{s.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Held Items */}
        {heldItems.length > 0 && (
          <section className="detail-section">
            <h2 className="section-title">Held Items (Wild)</h2>
            <div className="ability-list">
              {heldItems.map(h => (
                <span key={h.item.name} className="ability-badge">{h.item.name}</span>
              ))}
            </div>
          </section>
        )}

        {/* Game Appearances */}
        {gameIndices.length > 0 && (
          <section className="detail-section">
            <h2 className="section-title">Game Appearances</h2>
            <div className="moves-grid">
              {gameIndices.map(g => (
                <span key={g} className="move-chip capitalize">{g}</span>
              ))}
            </div>
          </section>
        )}

        {/* Moves */}
        <section className="detail-section">
          <h2 className="section-title">Moves</h2>
          <div className="moves-grid">
            {pokemon.moves.slice(0, 80).map(m => (
              <span key={m.move.name} className="move-chip">{m.move.name}</span>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default PokemonDetails;

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./pokesdetails.css";
import loader from './assets/enhanced_circle.png';

const PokemonDetails = () => {
  const { id } = useParams();
  const [pokemon, setPokemon] = useState(null);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    const fetchPokemonDetails = async () => {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await response.json();
        setPokemon(data);
        setloading(false);
      } catch (error) {
        console.error("Error fetching Pokémon details:", error);
      }
    };

    fetchPokemonDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="loader-container">
        <img src={loader} alt="Loading..." className="loader" />
      </div>
    );
  }

  return (
    <div className="pokemon-details-container">

      <div className="pokemon-image-container">
        <img
          style={{
            height: "auto",
            width: "100%",
            maxHeight: "420px",
            maxWidth: "420px",
            objectFit: "contain",
          }}
          src={pokemon?.sprites?.other?.["official-artwork"]?.front_default ||
            pokemon?.sprites?.other?.["official-artwork"]?.front_shiny ||
            pokemon?.sprites?.front_default ||
            "./default.jpg"}
          alt={pokemon.name}
          className="pokemon-image"
        />
      </div>


      <div className="pokemon-info-container">
        <h1>{pokemon.name.toUpperCase()}</h1>
        <p><strong>Type:</strong> {pokemon?.types?.map((t) => t.type.name).join(", ") || "N/A"}</p>
        <p><strong>Height:</strong> {pokemon?.height ?? "N/A"}</p>
        <p><strong>Weight:</strong> {pokemon?.weight ?? "N/A"}</p>
        <p><strong>Abilities:</strong> {pokemon?.abilities?.map((a) => a.ability.name).join(", ") || "N/A"}</p>



        <p><strong>Moves:</strong></p>
        <p className="moves-list">
          {pokemon?.moves?.slice(0, 50).map((m) => m.move.name).join(" • ") || "N/A"}
        </p>


        <h3>Stats</h3>
        <ul className="stats-list">
          {pokemon?.stats?.map((s, index) => (
            <li key={index}>
              <strong>{s.stat.name}:</strong> {s.base_stat}
            </li>
          )) || <li>N/A</li>}
        </ul>

        <h3>Forms</h3>
        <ul className="stats-list">
          {pokemon?.forms?.map((f, index) => (
            <li key={index}>{f.name}</li>
          )) || <li>N/A</li>}
        </ul>


      </div>
    </div>

  );
};

export default PokemonDetails;

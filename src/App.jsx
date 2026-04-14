import React, { useEffect, useState, useCallback, useRef } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Card from './components/Card'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PokemonDetails from './Pokemondetails';
import loader from './assets/enhanced_circle.png';

const BATCH_SIZE = 24;

const REGION_RANGES = {
  Kanto:  [1,   151],
  Johto:  [152, 251],
  Hoenn:  [252, 386],
  Sinnoh: [387, 493],
  Unova:  [494, 649],
  Kalos:  [650, 721],
  Alola:  [722, 809],
  Galar:  [810, 905],
  Paldea: [906, 1010],
};

function getIdFromUrl(url) {
  const parts = url.split('/').filter(Boolean);
  return parseInt(parts[parts.length - 1]);
}

function App() {
  const [allPoke, setAllPoke] = useState([]);
  const [loadedData, setLoadedData] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState({ kind: 'all', label: 'All' });
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredListRef = useRef([]);
  const baseListRef = useRef([]);     
  const batchStartRef = useRef(0);
  const batchLoadingRef = useRef(false);
  const observerRef = useRef(null);

  const loadNextBatch = useCallback(async () => {
    if (batchLoadingRef.current) return;
    const list = filteredListRef.current;
    const start = batchStartRef.current;
    if (start >= list.length) return;

    const batch = list.slice(start, start + BATCH_SIZE);
    if (batch.length === 0) return;

    batchLoadingRef.current = true;
    setBatchLoading(true);
    try {
      const results = await Promise.all(
        batch.map(p => fetch(p.url).then(r => r.json()))
      );
      setLoadedData(prev => [...prev, ...results]);
      batchStartRef.current = start + BATCH_SIZE;
    } catch (err) {
      console.error(err);
    }
    batchLoadingRef.current = false;
    setBatchLoading(false);
  }, []);

  const applyFilter = useCallback(async (newList, filterObj, search = '') => {
    const searchFiltered = search
      ? newList.filter(p => p.name.includes(search.toLowerCase().trim()))
      : newList;

    setActiveFilter(filterObj);
    filteredListRef.current = searchFiltered;
    batchStartRef.current = 0;
    setLoadedData([]);
    setTotalCount(searchFiltered.length);

    const batch = searchFiltered.slice(0, BATCH_SIZE);
    batchLoadingRef.current = true;
    setBatchLoading(true);
    try {
      const results = await Promise.all(
        batch.map(p => fetch(p.url).then(r => r.json()))
      );
      setLoadedData(results);
      batchStartRef.current = BATCH_SIZE;
    } catch (err) {
      console.error(err);
    }
    batchLoadingRef.current = false;
    setBatchLoading(false);
  }, []);

  useEffect(() => {
    fetch('https://pokeapi.co/api/v2/pokemon/?offset=0&limit=2000')
      .then(res => res.json())
      .then(json => {
        const list = json.results;
        setAllPoke(list);
        baseListRef.current = list;
        filteredListRef.current = list;
        setTotalCount(list.length);
        setInitialLoading(false);
        loadNextBatch();
      })
      .catch(err => console.error(err));
  }, []);

  const handleRegionSelect = useCallback((region) => {
    const [min, max] = REGION_RANGES[region];
    const filtered = allPoke.filter(p => {
      const id = getIdFromUrl(p.url);
      return id >= min && id <= max;
    });
    baseListRef.current = filtered;
    setSearchTerm('');
    applyFilter(filtered, { kind: 'region', label: region }, '');
  }, [allPoke, applyFilter]);

  const handleTypeSelect = useCallback(async (type) => {
    setInitialLoading(true);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/type/${type.toLowerCase()}`);
      const data = await res.json();
      const typeNames = new Set(data.pokemon.map(p => p.pokemon.name));
      const filtered = allPoke.filter(p => typeNames.has(p.name));
      baseListRef.current = filtered;
      setSearchTerm('');
      setInitialLoading(false);
      applyFilter(filtered, { kind: 'type', label: type }, '');
    } catch (err) {
      console.error(err);
      setInitialLoading(false);
    }
  }, [allPoke, applyFilter]);

  const handleClearFilter = useCallback(() => {
    baseListRef.current = allPoke;
    setSearchTerm('');
    applyFilter(allPoke, { kind: 'all', label: 'All' }, '');
  }, [allPoke, applyFilter]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    const searchFiltered = term
      ? baseListRef.current.filter(p => p.name.includes(term.toLowerCase().trim()))
      : baseListRef.current;

    filteredListRef.current = searchFiltered;
    batchStartRef.current = 0;
    setLoadedData([]);
    setTotalCount(searchFiltered.length);

    const batch = searchFiltered.slice(0, BATCH_SIZE);
    batchLoadingRef.current = true;
    setBatchLoading(true);
    Promise.all(batch.map(p => fetch(p.url).then(r => r.json())))
      .then(results => {
        setLoadedData(results);
        batchStartRef.current = BATCH_SIZE;
      })
      .catch(err => console.error(err))
      .finally(() => {
        batchLoadingRef.current = false;
        setBatchLoading(false);
      });
  }, []);

  const sentinelRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      const observer = new IntersectionObserver(
        (entries) => { if (entries[0].isIntersecting) loadNextBatch(); },
        { threshold: 0.1 }
      );
      observer.observe(node);
      observerRef.current = observer;
    }
  }, [loadNextBatch]);

  const hasMore = batchStartRef.current < filteredListRef.current.length;

  const subtitleText = () => {
    const base = activeFilter.kind === 'region'
      ? `${activeFilter.label} Region`
      : activeFilter.kind === 'type'
      ? `${activeFilter.label} Type`
      : 'All Pokémon';
    return searchTerm
      ? `${totalCount} result${totalCount !== 1 ? 's' : ''} for "${searchTerm}" in ${base}`
      : `${base} · ${totalCount} Pokémon`;
  };

  if (initialLoading) {
    return (
      <div className="loader-container">
        <img src={loader} alt="Loading..." className="loader" />
        <p className="loader-text">Loading Pokédex...</p>
      </div>
    );
  }

  return (
    <Router>
      <Navbar
        onRegionSelect={handleRegionSelect}
        onTypeSelect={handleTypeSelect}
        onClearFilter={handleClearFilter}
        activeFilter={activeFilter}
        searchTerm={searchTerm}
        onSearch={handleSearch}
      />
      <Routes>
        <Route
          path="/"
          element={
            <div className="page-wrapper">
              <div className="page-header">
                <h1 className="page-title">Pokédex</h1>
                <p className="page-subtitle">{subtitleText()}</p>
              </div>

              {loadedData.length === 0 && !batchLoading ? (
                <div className="no-results">
                  <span className="no-results-icon">🔍</span>
                  <p>No Pokémon found for <strong>"{searchTerm}"</strong></p>
                  <button className="clear-search-btn" onClick={() => handleSearch('')}>
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="parent">
                  {loadedData.map((pokemon) => (
                    <Card
                      key={pokemon.id}
                      index={pokemon.id}
                      title={pokemon.name}
                      imageUrl={
                        pokemon.sprites.other['official-artwork'].front_default ||
                        './pokeballl.png'
                      }
                      types={pokemon.types}
                    />
                  ))}
                </div>
              )}

              {hasMore && (
                <div ref={sentinelRef} className="scroll-sentinel">
                  {batchLoading && (
                    <div className="batch-loader">
                      <div className="batch-spinner" />
                      <span>Loading more Pokémon...</span>
                    </div>
                  )}
                </div>
              )}

              {!hasMore && loadedData.length > 0 && (
                <p className="end-message">
                  {searchTerm
                    ? `${loadedData.length} Pokémon matched`
                    : `You've seen them all! ${loadedData.length} Pokémon loaded.`}
                </p>
              )}
            </div>
          }
        />
        <Route path="/pokemon/:id" element={<PokemonDetails />} />
      </Routes>
    </Router>
  );
}

export default App;

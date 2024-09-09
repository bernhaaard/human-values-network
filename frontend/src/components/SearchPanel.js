import React, { useState } from 'react';

const SearchPanel = ({ onSearch, onThresholdChange, style }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [threshold, setThreshold] = useState(0.7);

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const handleThresholdChange = (e) => {
    const newThreshold = parseFloat(e.target.value);
    setThreshold(newThreshold);
    onThresholdChange(newThreshold);
  };

  return (
    <div style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search values"
        style={{ marginBottom: 10 }}
      />
      <button onClick={handleSearch}>Search</button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={threshold}
        onChange={handleThresholdChange}
        style={{ marginTop: 10 }}
      />
      <span>Similarity Threshold: {threshold.toFixed(2)}</span>
    </div>
  );
};

export default SearchPanel;
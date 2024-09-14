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
    <div style={{
      ...style,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '15px',
      borderRadius: '10px',
      backdropFilter: 'blur(5px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search values"
        style={{
          marginBottom: 10,
          padding: '8px',
          borderRadius: '5px',
          border: '1px solid #ccc',
          width: '200px'
        }}
      />
      <button
        onClick={handleSearch}
        style={{
          padding: '8px 15px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Search
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={threshold}
        onChange={handleThresholdChange}
        style={{ marginTop: 15, width: '100%' }}
      />
      <span style={{ color: 'white', marginTop: 5 }}>
        Similarity Threshold: {threshold.toFixed(2)}
      </span>
    </div>
  );
};

export default SearchPanel;
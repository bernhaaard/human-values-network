import React from 'react';

const NodeInfoPanel = ({ selectedNode, graphData, style }) => {
  if (!selectedNode) return null;

  const connectedNodes = graphData.links
    .filter(link => link.source.id === selectedNode.id || link.target.id === selectedNode.id)
    .map(link => {
      const connectedNode = link.source.id === selectedNode.id ? link.target : link.source;
      return { ...connectedNode, similarity: link.value };
    });

  return (
    <div style={{
      ...style,
      background: 'rgba(255,255,255,0.1)',
      padding: '15px',
      borderRadius: '10px',
      backdropFilter: 'blur(5px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      color: 'white',
      maxWidth: '300px',
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      <h3 style={{ marginTop: 0, color: '#4CAF50' }}>{selectedNode.name}</h3>
      <p style={{ fontWeight: 'bold' }}>Connected values:</p>
      <ul style={{ padding: 0, listStyleType: 'none' }}>
        {connectedNodes.map(node => (
          <li key={node.id} style={{ marginBottom: '8px' }}>
            <span style={{ color: '#FFA500' }}>{node.name}</span>
            <br />
            <small>Similarity: {node.similarity.toFixed(2)}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NodeInfoPanel;
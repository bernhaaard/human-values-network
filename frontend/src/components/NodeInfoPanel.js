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
      <div style={{ ...style, background: 'rgba(255,255,255,0.6)', padding: 10, color: 'white'}}>
      <h3>{selectedNode.name}</h3>
      <p>Connected values:</p>
      <ul>
        {connectedNodes.map(node => (
          <li key={node.id}>
            {node.name} (Similarity: {node.similarity.toFixed(2)})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NodeInfoPanel;
import React, { useState, useEffect } from 'react';
import Graph3D from './Graph3D';
import SearchPanel from './SearchPanel';
import NodeInfoPanel from './NodeInfoPanel';
import useGraphData from '../hooks/useGraphData';

const HumanValuesNetwork = () => {
  const { graphData, isLoading, error, setSimilarityThreshold } = useGraphData();
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('HumanValuesNetwork rendered. Graph data:', graphData);
  }, [graphData]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    const searchedNode = graphData.nodes.find(node =>
      node.name.toLowerCase().includes(term.toLowerCase())
    );
    if (searchedNode) {
      setSelectedNode(searchedNode);
    }
  };

  if (isLoading) {
    return <div>Loading embeddings...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!graphData.nodes.length) {
    return <div>No data available to render the graph.</div>;
  }

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <Graph3D
        graphData={graphData}
        onNodeClick={setSelectedNode}
        searchTerm={searchTerm}
      />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 10
      }}>
        <SearchPanel
          onSearch={handleSearch}
          onThresholdChange={setSimilarityThreshold}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            pointerEvents: 'auto'
          }}
        />
        <NodeInfoPanel
          selectedNode={selectedNode}
          graphData={graphData}
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            pointerEvents: 'auto'
          }}
        />
      </div>
    </div>
  );
};

export default HumanValuesNetwork;
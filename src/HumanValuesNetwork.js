import React, { useRef, useEffect, useState, useCallback, useMemo  } from 'react';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';

const HumanValuesNetwork = () => {
  const containerRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [embeddings, setEmbeddings] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);

  const values = useMemo(() => [
    'integrity', 'compassion', 'wisdom', 'courage', 'honesty', 'respect', 'responsibility', 'fairness',
    'self-awareness', 'resilience', 'creativity', 'curiosity', 'perseverance', 'adaptability', 'empathy', 'trust',
    'communication', 'cooperation', 'forgiveness', 'loyalty', 'justice', 'kindness', 'knowledge', 'leadership'
  ], []);

  const loadEmbeddings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/embeddings?words=${values.join(',')}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEmbeddings(data);
      setError(null);
    } catch (e) {
      console.error("Failed to load embeddings:", e);
      setError(`Failed to load embeddings: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [values]);

  const calculateCosineSimilarity = useCallback((vec1, vec2) => {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitude1 * magnitude2);
  }, []);

  const generateGraphData = useCallback(() => {
    const nodes = values.map((value, index) => ({ id: index, name: value, val: 10 }));
    const links = [];

    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        const similarity = calculateCosineSimilarity(embeddings[values[i]], embeddings[values[j]]);
        if (similarity > similarityThreshold) {
          links.push({ source: i, target: j, value: similarity });
        }
      }
    }

    // Assign groups based on connectivity
    const assignGroups = () => {
      let groupCounter = 0;
      const nodeGroups = new Map();

      const dfs = (nodeId, group) => {
        if (nodeGroups.has(nodeId)) return;
        nodeGroups.set(nodeId, group);
        links.forEach(link => {
          if (link.source === nodeId) dfs(link.target, group);
          if (link.target === nodeId) dfs(link.source, group);
        });
      };

      nodes.forEach(node => {
        if (!nodeGroups.has(node.id)) {
          dfs(node.id, groupCounter++);
        }
      });

      nodes.forEach(node => {
        node.group = nodeGroups.get(node.id);
      });
    };

    assignGroups();
    setGraphData({ nodes, links });
  }, [embeddings, calculateCosineSimilarity, similarityThreshold, values]);

  useEffect(() => {
    loadEmbeddings();
  }, [loadEmbeddings]);

  useEffect(() => {
    if (Object.keys(embeddings).length > 0) {
      generateGraphData();
    }
  }, [embeddings, generateGraphData]);

  useEffect(() => {
    if (!graphData.nodes.length) return;

    const Graph = ForceGraph3D()(containerRef.current)
      .graphData(graphData)
      .nodeLabel('name')
      .nodeColor(node => colorByGroup(node.group))
      .nodeOpacity(0.7)
      .nodeResolution(16)
      .nodeVal('val')
      .linkWidth(link => link.value * 2)
      .linkOpacity(0.5)
      .linkColor(() => 'rgba(255,255,255,0.75)')
      .backgroundColor('#000011')
      .showNavInfo(false)
      .onNodeClick(node => {
        setSelectedNode(node);
        const distance = 120;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
        Graph.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node,
          3000
        );
      });

    Graph.d3Force('charge').strength(-20);
    Graph.d3Force('link').distance(link => 50 + (1 - link.value) * 100);

    Graph.nodeThreeObject(node => {
      const group = new THREE.Group();

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(10),
        new THREE.MeshLambertMaterial({
          color: colorByGroup(node.group),
          transparent: true,
          opacity: 0.7
        })
      );
      group.add(sphere);

      const sprite = new SpriteText(node.name);
      sprite.color = '#ffffff';
      sprite.backgroundColor = colorByGroup(node.group);
      sprite.padding = 2;
      sprite.textHeight = 8;
      sprite.renderOrder = 1;
      sprite.material.depthTest = false;
      group.add(sprite);

      return group;
    });

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    Graph.scene().add(ambientLight);

    // Add point light
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    Graph.scene().add(pointLight);

    // Set initial camera position
    Graph.cameraPosition({ x: 0, y: 0, z: 500 });

    // Add camera controls
    const controls = Graph.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    // Add custom particle system for background
    const particleSystem = createParticleSystem();
    Graph.scene().add(particleSystem);

    // Animation loop
    Graph.onEngineTick(() => {
      particleSystem.rotation.y += 0.0005;
      controls.update();
    });

    // Ensure the graph uses the full viewport
    const resizeGraph = () => {
      Graph.width(window.innerWidth)
        .height(window.innerHeight);
    };

    // Call resizeGraph initially and add event listener
    resizeGraph();
    window.addEventListener('resize', resizeGraph);

    // Clean up function
    return () => {
      window.removeEventListener('resize', resizeGraph);
      Graph._destructor();
    };

  }, [graphData]);

  const colorByGroup = group => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9d56e', '#ff8a5c', '#a8d8ea'];
    return colors[group % colors.length];
  };

  const createParticleSystem = () => {
    const particles = new THREE.BufferGeometry();
    const particleCount = 5000;

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;

      colors[i * 3] = Math.random();
      colors[i * 3 + 1] = Math.random();
      colors[i * 3 + 2] = Math.random();
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.5
    });

    return new THREE.Points(particles, particleMaterial);
  };

  const handleSearch = () => {
    const searchedNode = graphData.nodes.find(node =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (searchedNode) {
      setSelectedNode(searchedNode);
      // Move camera to focus on the searched node
      const Graph = ForceGraph3D()(containerRef.current);
      Graph.cameraPosition(
        { x: searchedNode.x, y: searchedNode.y, z: searchedNode.z + 100 },
        searchedNode,
        2000
      );
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden'
    }}>
      {isLoading && <div style={{ position: 'absolute', top: 10, left: 10, color: 'white' }}>Loading embeddings...</div>}
      {error && (
        <div style={{ position: 'absolute', top: 10, left: 10, color: 'red' }}>
          {error}
        </div>
      )}
      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
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
          value={similarityThreshold}
          onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
          style={{ marginTop: 10 }}
        />
        <span>Similarity Threshold: {similarityThreshold.toFixed(2)}</span>
      </div>
      {selectedNode && (
        <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.7)', padding: 10, color: 'white' }}>
          <h3>{selectedNode.name}</h3>
          <p>Connected values:</p>
          <ul>
            {graphData.links
              .filter(link => link.source.id === selectedNode.id || link.target.id === selectedNode.id)
              .map(link => {
                const connectedNode = link.source.id === selectedNode.id ? link.target : link.source;
                return (
                  <li key={connectedNode.id}>
                    {connectedNode.name} (Similarity: {link.value.toFixed(2)})
                  </li>
                );
              })}
          </ul>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default HumanValuesNetwork;
import React, { useRef, useEffect } from 'react';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';

const Force3DGraph = ({ data }) => {
  const containerRef = useRef();

  useEffect(() => {
    console.log('Force3DGraph effect running, data:', data);

    const Graph = ForceGraph3D()(containerRef.current)
      .graphData(data)
      .nodeLabel('id')
      .nodeColor(node => colorByGroup(node.group))
      .nodeRelSize(6)
      .linkWidth(2)
      .linkOpacity(0.5)
      .linkColor(() => 'rgba(255,255,255,0.5)')
      .onNodeClick(node => {
        // Aim at node from outside it
        const distance = 40;
        const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

        Graph.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
          node, // lookAt ({ x, y, z })
          3000  // ms transition duration
        );
      });

    // Implement node hover behavior
    Graph.nodeThreeObject(node => {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ depthWrite: false, transparent: true, opacity: 0 }));
      sprite.material.map = new THREE.CanvasTexture(generateTextTexture(node.id));
      sprite.scale.set(12, 12);
      return sprite;
    });

    // Set initial camera position
    Graph.cameraPosition({ z: 120 });

    return () => {
      Graph._destructor();
    };
  }, [data]);

  // Helper function to generate color based on group
  const colorByGroup = group => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    return colors[group % colors.length];
  };

  // Helper function to generate text texture
  const generateTextTexture = text => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '12px Sans-Serif';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText(text, 32, 32);
    return canvas;
  };

  return <div ref={containerRef} style={{ width: '100%', height: '500px', border: '1px solid blue' }} />;
};

export default Force3DGraph;
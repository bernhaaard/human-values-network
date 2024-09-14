import React, { useRef, useEffect, useCallback } from 'react';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';

const Graph3D = ({ graphData, onNodeClick, searchTerm }) => {
  const containerRef = useRef();

  const colorByGroup = useCallback((group) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9d56e', '#ff8a5c', '#a8d8ea'];
    return colors[group % colors.length];
  }, []);

  const createParticleSystem = useCallback(() => {
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
  }, []);

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
      .onNodeClick(onNodeClick);

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

    // Highlight searched node
    if (searchTerm) {
      const searchedNode = graphData.nodes.find(node =>
        node.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (searchedNode) {
        Graph.cameraPosition(
          { x: searchedNode.x, y: searchedNode.y, z: searchedNode.z + 200 }, // look at position
          { x: searchedNode.x, y: searchedNode.y, z: searchedNode.z }, // new position
          1000 // transition duration
        );
        Graph.zoom(2, 1000);
      }
    }

    // Ensure the graph uses the full viewport
    const resizeGraph = () => {
      Graph.width(window.innerWidth)
        .height(window.innerHeight);
    };

    // Call resizeGraph initially and add event listener
    resizeGraph();
    window.addEventListener('resize', resizeGraph);

    return () => {
      window.removeEventListener('resize', resizeGraph);
      Graph._destructor();
    };
  }, [graphData, onNodeClick, searchTerm, colorByGroup, createParticleSystem]);

  return <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />;
};

export default Graph3D;
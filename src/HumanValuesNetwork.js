import React, { useRef, useEffect, useState } from 'react';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';

const HumanValuesNetwork = () => {
  const containerRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    const categories = {
      'Core Values': ['Integrity', 'Compassion', 'Wisdom', 'Courage', 'Honesty', 'Respect', 'Responsibility', 'Fairness'],
      'Personal Growth': ['Self-awareness', 'Resilience', 'Creativity', 'Curiosity', 'Perseverance', 'Adaptability', 'Confidence', 'Humility'],
      'Interpersonal': ['Empathy', 'Trust', 'Communication', 'Cooperation', 'Forgiveness', 'Loyalty', 'Generosity', 'Kindness'],
      'Societal': ['Justice', 'Equality', 'Freedom', 'Democracy', 'Diversity', 'Sustainability', 'Peace', 'Community'],
      'Ethical': ['Morality', 'Accountability', 'Transparency', 'Integrity', 'Fairness', 'Human Rights', 'Animal Welfare', 'Environmental Stewardship'],
      'Professional': ['Excellence', 'Innovation', 'Leadership', 'Teamwork', 'Professionalism', 'Work Ethic', 'Continuous Learning', 'Customer Focus'],
    };

    const nodes = [];
    const links = [];
    let id = 0;

    // Create nodes
    Object.entries(categories).forEach(([category, values], categoryIndex) => {
      nodes.push({ id: id++, name: category, val: 20, group: categoryIndex, category: true });
      values.forEach(value => {
        nodes.push({ id: id++, name: value, val: 10, group: categoryIndex, category: false });
      });
    });

    // Create links
    nodes.forEach(node => {
      if (!node.category) {
        // Link to category
        links.push({ source: node.id, target: nodes.find(n => n.category && n.group === node.group).id, value: 1 });

        // Link to other values in same category
        nodes.filter(n => !n.category && n.group === node.group && n.id !== node.id)
          .forEach(target => links.push({ source: node.id, target: target.id, value: 0.5 }));

        // Link to related values in other categories (simplified for brevity)
        const relatedValues = nodes.filter(n => !n.category && n.group !== node.group)
          .sort(() => 0.5 - Math.random()).slice(0, 3);
        relatedValues.forEach(target => links.push({ source: node.id, target: target.id, value: 0.3 }));
      }
    });

    setGraphData({ nodes, links });
  }, []);

  useEffect(() => {
    if (!graphData.nodes.length) return;

    const Graph = ForceGraph3D()(containerRef.current)
      .graphData(graphData)
      .nodeLabel('name')
      .nodeColor(node => node.category ? '#ffffff' : colorByGroup(node.group))
      .nodeOpacity(0.7)
      .nodeResolution(16)
      .nodeVal(node => node.category ? 30 : 20)
      .linkWidth(1)
      .linkOpacity(0.2)
      .linkColor(() => '#ffffff')
      .backgroundColor('#000011')
      .showNavInfo(false)
      .onNodeClick(node => {
        const distance = 120;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
        Graph.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node,
          3000
        );
      });

    Graph.d3Force('charge').strength(-300);
    Graph.d3Force('link').distance(link => link.value === 1 ? 80 : 50);

    Graph.nodeThreeObject(node => {
      const group = new THREE.Group();

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(node.category ? 15 : 10),
        new THREE.MeshLambertMaterial({
          color: node.category ? '#ffffff' : colorByGroup(node.group),
          transparent: true,
          opacity: 0.7
        })
      );
      group.add(sphere);

      const sprite = new SpriteText(node.name);
      sprite.color = node.category ? colorByGroup(node.group) : '#000000';
      sprite.backgroundColor = node.category ? '#ffffff' : 'rgba(255,255,255,0.7)';
      sprite.padding = 2;
      sprite.textHeight = node.category ? 8 : 6;
      sprite.fontWeight = node.category ? 'bold' : 'normal';
      sprite.renderOrder = 1; // Ensure text renders on top
      sprite.material.depthTest = false; // Disable depth testing for text
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

  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      overflow: 'hidden'
    }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default HumanValuesNetwork;
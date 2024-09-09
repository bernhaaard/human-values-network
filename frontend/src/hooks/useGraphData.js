import { useState, useEffect, useCallback, useMemo } from 'react';

const useGraphData = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [embeddings, setEmbeddings] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);

  // Memoize the values array
  const values = useMemo(() => [
    'integrity', 'compassion', 'wisdom', 'courage', 'honesty', 'respect', 'responsibility', 'fairness',
    'self-awareness', 'resilience', 'creativity', 'curiosity', 'perseverance', 'adaptability', 'empathy', 'trust',
    'communication', 'cooperation', 'forgiveness', 'loyalty', 'justice', 'kindness', 'knowledge', 'leadership', 'beauty'
  ], []);

  const calculateCosineSimilarity = useCallback((vec1, vec2) => {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitude1 * magnitude2);
  }, []);

  const generateGraphData = useCallback(() => {
    const nodes = values.map((value, index) => ({
      id: index,
      name: value,
      val: graphData.links.filter(link => link.source === index || link.target === index).length
    }));
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

  const loadEmbeddings = useCallback(async () => {
    setIsLoading(true);
    try {
      // For debugging, log the URL
      const url = `http://localhost:3001/api/embeddings?words=${values.join(',')}`;
      console.log('Fetching embeddings from:', url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received embeddings:', data);
      setEmbeddings(data);
      setError(null);
    } catch (e) {
      console.error("Failed to load embeddings:", e);
      setError(`Failed to load embeddings: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [values]);

  useEffect(() => {
    loadEmbeddings();
  }, [loadEmbeddings]);

  useEffect(() => {
    if (Object.keys(embeddings).length > 0) {
      console.log('Generating graph data');
      generateGraphData();
    }
  }, [embeddings, generateGraphData]);

  console.log('Current graph data:', graphData);

  return { graphData, isLoading, error, setSimilarityThreshold };
};

export default useGraphData;
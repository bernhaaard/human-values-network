import { useState, useEffect, useCallback, useMemo } from 'react';

const useGraphData = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [embeddings, setEmbeddings] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);

  // Memoize the values array
  const values = useMemo(() => [
    "intelligence",
    "Soulful-bonding",
    "Spirituality",
    "Stability",
    "Success",
    "Symbiosis",
    "Temperance",
    "Thoughtfulness",
    "Tolerance",
    "Transparency",
    "Trust",
    "Trustworthiness",
    "Truth",
    "Truthfulness",
    "Unconditional-love",
    "Understanding",
    "Unity",
    "Honesty",
    "Honor",
    "Honorable-conduct",
    "Hope",
    "Humor",
    "Independence",
    "Influence",
    "Inner-harmony",
    "Insightfulness",
    "Intelligence",
    "Intimacy",
    "Introspection",
    "Intuition",
    "Invention",
    "Reliability",
    "Respect",
    "Love",
    "Loyalty",
    "Responsibility",
    "Joy",
    "Learning",
    "Listening",
    "Meaningful-work",
    "Mercy",
    "Moderation",
    "Nonviolence",
    "Nurturing-nature",
    "Openness",
    "Optimism",
    "Passion",
    "Patience",
    "Peace",
    "Justice",
    "Kindness",
    "Knowledge",
    "Leadership",
    "Veracity",
    "Virtuousness",
    "Vitality",
    "Warmth",
    "Wealth",
    "Wellness",
    "Willingness",
    "Wit",
    "Wonder",
    "Zeal",
    "Deep-connections",
    "Detachment",
    "Diligence",
    "Dignity",
    "Efficiency",
    "Emotional-intelligence",
    "Emotional-support",
    "Enthusiasm",
    "Equal-relationship",
    "Equality",
    "Ethical-awareness",
    "Excellence",
    "Excitement",
    "Fairness",
    "Faith",
    "Faithfulness",
    "Financial-security",
    "Fitness",
    "Flexibility",
    "Forbearance",
    "Forgiveness",
    "Fortitude",
    "Friendliness",
    "Friendship",
    "Fun",
    "Generosity",
  ], []);

  const calculateCosineSimilarity = useCallback((vec1, vec2) => {
    if (!Array.isArray(vec1) || !Array.isArray(vec2) || vec1.length !== vec2.length) {
      console.error('Invalid vectors:', vec1, vec2);
      return 0;
    }
  
    const dotProduct = vec1.reduce((sum, val, i) => {
      if (typeof val !== 'number' || typeof vec2[i] !== 'number') {
        console.error(`Invalid value at index ${i}:`, val, vec2[i]);
        return sum;
      }
      return sum + val * vec2[i];
    }, 0);
  
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  
    if (magnitude1 === 0 || magnitude2 === 0) {
      console.error('Zero magnitude vector:', magnitude1, magnitude2);
      return 0;
    }
  
    return dotProduct / (magnitude1 * magnitude2);
  }, []);
  
  const generateGraphData = useCallback(() => {
    console.log('Generating graph data with embeddings:', embeddings);
    const nodes = values.map((value, index) => ({
      id: index,
      name: value,
      val: 1 // We'll update this later
    }));
    const links = [];
  
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        const embedding1 = embeddings[values[i]];
        const embedding2 = embeddings[values[j]];
        
        if (!embedding1 || !embedding2) {
          console.error(`Missing embedding for ${values[i]} or ${values[j]}`);
          continue;
        }
  
        const similarity = calculateCosineSimilarity(embedding1, embedding2);
        if (similarity > similarityThreshold) {
          links.push({ source: i, target: j, value: similarity });
        }
      }
    }
  
    // Update node values based on the number of connections
    nodes.forEach(node => {
      node.val = links.filter(link => link.source === node.id || link.target === node.id).length + 1;
    });
  
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
    console.log('Generated graph data:', { nodes, links });
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
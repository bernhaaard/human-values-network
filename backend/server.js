const express = require('express');
const cors = require('cors');
const path = require('path');
const WordEmbeddingService = require('./WordEmbeddingService');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const embeddingService = new WordEmbeddingService();

// Load embeddings when the server starts
(async () => {
  try {
    const embeddingsPath = path.join(__dirname, 'glove.6B.200d.txt');
    console.log(`Attempting to load embeddings from: ${embeddingsPath}`);
    await embeddingService.loadEmbeddings(embeddingsPath);
    console.log('Embeddings loaded successfully');
  } catch (error) {
    console.error('Error loading embeddings:', error);
    process.exit(1); // Exit the process if we can't load embeddings
  }
})();

app.get('/api/embeddings', (req, res) => {
  const words = req.query.words.split(',');
  const embeddings = {};
  words.forEach(word => {
    const embedding = embeddingService.getEmbedding(word);
    if (embedding) {
      embeddings[word] = embedding;
    }
  });
  res.json(embeddings);
});

app.get('/api/similar-words', (req, res) => {
  const word = req.query.word;
  const n = parseInt(req.query.n) || 10;
  const similarWords = embeddingService.findSimilarWords(word, n);
  res.json(similarWords);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
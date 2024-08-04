const fs = require('fs');
const fsPromises = require('fs').promises;
const readline = require('readline');

class WordEmbeddingService {
  constructor() {
    this.embeddings = new Map();
  }

  async loadEmbeddings(filePath) {
    // Check if file exists before trying to read it
    try {
      await fsPromises.access(filePath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`Cannot access file at ${filePath}: ${error.message}`);
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      const [word, ...vector] = line.split(' ');
      this.embeddings.set(word, vector.map(Number));
    }

    console.log(`Loaded ${this.embeddings.size} word embeddings`);
  }

  getEmbedding(word) {
    return this.embeddings.get(word.toLowerCase());
  }

  findSimilarWords(word, n = 10) {
    const embedding = this.getEmbedding(word);
    if (!embedding) return [];

    const similarities = Array.from(this.embeddings.entries()).map(([w, e]) => ({
      word: w,
      similarity: this.cosineSimilarity(embedding, e)
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(1, n + 1) // Exclude the word itself
      .map(item => item.word);
  }

  cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (mag1 * mag2);
  }
}

module.exports = WordEmbeddingService;
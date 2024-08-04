import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
from scipy.cluster.hierarchy import dendrogram, linkage
import gensim.downloader as api
import nltk
from nltk.corpus import wordnet
from nltk.sentiment import SentimentIntensityAnalyzer
import random
import json

# Download required NLTK data
nltk.download('wordnet')
nltk.download('vader_lexicon')

# Load pre-trained GloVe embeddings
glove_vectors = api.load("glove-wiki-gigaword-300")

# Initialize sentiment analyzer
sia = SentimentIntensityAnalyzer()

def get_embedding(word):
    try:
        return glove_vectors[word]
    except KeyError:
        return np.zeros(300)

def calculate_similarity(embedding1, embedding2):
    return cosine_similarity([embedding1], [embedding2])[0][0]

def get_related_words(word, n=10):
    embedding = get_embedding(word)
    similarities = [(w, calculate_similarity(embedding, get_embedding(w))) 
                    for w in glove_vectors.key_to_index.keys()]
    return sorted(similarities, key=lambda x: x[1], reverse=True)[1:n+1]

def expand_value_list(initial_values, expansion_factor=2):
    expanded_values = set(initial_values)
    for value in initial_values:
        related = get_related_words(value)
        expanded_values.update([word for word, _ in related])
    return list(expanded_values)[:len(initial_values) * expansion_factor]

def calculate_abstractness(word):
    concrete_words = ['tangible', 'physical', 'concrete', 'specific']
    abstract_words = ['abstract', 'theoretical', 'conceptual', 'general']
    
    concrete_score = max(calculate_similarity(get_embedding(word), get_embedding(w)) for w in concrete_words)
    abstract_score = max(calculate_similarity(get_embedding(word), get_embedding(w)) for w in abstract_words)
    
    return abstract_score / (concrete_score + abstract_score) * 100

def calculate_philosophical_alignment(word):
    alignments = {
        'virtue_ethics': ['virtue', 'character', 'excellence'],
        'deontological': ['duty', 'obligation', 'rule'],
        'consequentialism': ['consequence', 'outcome', 'result'],
        'care_ethics': ['care', 'empathy', 'relationship']
    }
    
    embedding = get_embedding(word)
    return {k: max(calculate_similarity(embedding, get_embedding(w)) for w in v) 
            for k, v in alignments.items()}

def calculate_temporal_orientation(word):
    orientations = {
        'past': ['history', 'tradition', 'memory'],
        'present': ['current', 'now', 'immediate'],
        'future': ['goal', 'plan', 'aspiration']
    }
    
    embedding = get_embedding(word)
    raw_scores = {k: max(calculate_similarity(embedding, get_embedding(w)) for w in v) 
                  for k, v in orientations.items()}
    total = sum(raw_scores.values())
    return {k: v / total for k, v in raw_scores.items()}

def generate_value_dataset(initial_values):
    values = expand_value_list(initial_values)
    dataset = []
    embeddings = [get_embedding(value) for value in values]
    
    # Calculate centrality
    similarity_matrix = cosine_similarity(embeddings)
    centrality_scores = np.mean(similarity_matrix, axis=1)
    
    for i, value in enumerate(values):
        embedding = embeddings[i]
        
        node = {
            "id": f"value_{i:03d}",
            "name": value,
            "embedding": embedding.tolist(),
            "categories": random.sample(["Moral", "Ethical", "Social", "Personal", "Intellectual", "Emotional", "Spiritual", "Physical", "Professional", "Cultural"], k=2),
            "abstractness": calculate_abstractness(value),
            "centrality": float(centrality_scores[i]),
            "philosophical_alignment": calculate_philosophical_alignment(value),
            "psychological_needs": random.sample(["Physiological", "Safety", "Love and Belonging", "Esteem", "Self-actualization", "Cognitive", "Aesthetic", "Transcendence"], k=2),
            "societal_importance": random.randint(60, 100),  # Assuming all values have some importance
            "temporal_orientation": calculate_temporal_orientation(value),
            "cultural_variability": random.random(),
            "emotional_valence": sia.polarity_scores(value)['compound'],
            "related_values": [],
            "opposing_values": [],
            "contextual_relevance": {
                "personal": random.random(),
                "professional": random.random(),
                "societal": random.random()
            },
            "historical_trend": [
                {"year": y, "importance": random.uniform(0.5, 1)} 
                for y in range(1900, 2021, 20)
            ],
            "interdependence": random.random(),
            "practical_scenarios": [f"Scenario {j+1}" for j in range(3)]  # Placeholder
        }
        dataset.append(node)
    
    # Add related and opposing values
    for i, node in enumerate(dataset):
        similarities = [(j, calculate_similarity(node["embedding"], dataset[j]["embedding"])) 
                        for j in range(len(dataset)) if i != j]
        related = sorted(similarities, key=lambda x: x[1], reverse=True)[:3]
        opposing = sorted(similarities, key=lambda x: x[1])[:2]
        
        node["related_values"] = [{"id": dataset[j]["id"], "name": dataset[j]["name"], "similarity": sim} for j, sim in related]
        node["opposing_values"] = [{"id": dataset[j]["id"], "name": dataset[j]["name"], "opposition": 1 - sim} for j, sim in opposing]
    
    return dataset

# Example usage
initial_values = ["honesty", "compassion", "justice", "freedom", "wisdom", ...]  # Your initial list of 173 values
value_dataset = generate_value_dataset(initial_values)

# Save to JSON
with open('value_dataset.json', 'w') as f:
    json.dump(value_dataset, f, indent=2)
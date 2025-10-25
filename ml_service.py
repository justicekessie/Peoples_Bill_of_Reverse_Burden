"""
Machine Learning Service for Clustering Submissions
Uses sentence transformers and clustering algorithms
"""

import numpy as np
from typing import List, Dict, Any
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
import hashlib
import json
from collections import Counter
import re

# For Phase 1, we'll use a simple TF-IDF approach
# In production, you'd use sentence-transformers
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA

class ClusteringService:
    """Service for clustering citizen submissions using AI/ML"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=500,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
    def preprocess_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^a-z0-9\s]', '', text)
        
        return text.strip()
    
    def extract_keywords(self, texts: List[str], n_keywords: int = 5) -> List[str]:
        """Extract top keywords from a list of texts"""
        # Combine all texts
        combined = ' '.join(texts)
        
        # Simple word frequency approach
        words = combined.lower().split()
        
        # Remove common stop words
        stop_words = {'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 
                      'as', 'are', 'was', 'were', 'in', 'to', 'for', 'of',
                      'with', 'from', 'up', 'about', 'into', 'through',
                      'during', 'how', 'all', 'each', 'other', 'some',
                      'would', 'make', 'like', 'has', 'had', 'should', 'must'}
        
        words = [w for w in words if w not in stop_words and len(w) > 3]
        
        # Count frequency
        word_counts = Counter(words)
        
        # Return top keywords
        return [word for word, _ in word_counts.most_common(n_keywords)]
    
    def generate_theme(self, keywords: List[str], texts: List[str]) -> str:
        """Generate a theme name from keywords and texts"""
        # Simple theme generation based on keywords
        # In production, you'd use GPT or similar
        
        themes_map = {
            'asset': 'Asset Declaration',
            'property': 'Property Disclosure',
            'wealth': 'Unexplained Wealth',
            'corruption': 'Anti-Corruption Measures',
            'investigation': 'Investigation Process',
            'confiscate': 'Asset Confiscation',
            'penalty': 'Penalties and Sanctions',
            'fair': 'Fair Hearing Rights',
            'whistleblower': 'Whistleblower Protection',
            'transparency': 'Transparency Requirements',
            'audit': 'Lifestyle Audits',
            'income': 'Income Verification',
            'bank': 'Financial Scrutiny',
            'office': 'Public Office Standards',
            'report': 'Reporting Requirements'
        }
        
        # Check keywords against theme map
        for keyword in keywords:
            for key, theme in themes_map.items():
                if key in keyword.lower():
                    return theme
        
        # Default theme based on most common keyword
        if keywords:
            return f"{keywords[0].title()}-Related Submissions"
        
        return "General Submissions"
    
    def generate_summary(self, texts: List[str]) -> str:
        """Generate a summary of the clustered texts"""
        # Simple approach: combine key sentences
        # In production, use a summarization model
        
        if not texts:
            return "No submissions in this cluster"
        
        # Take first few texts as summary
        sample_texts = texts[:3]
        summary_parts = []
        
        for text in sample_texts:
            # Take first sentence or first 100 chars
            sentences = text.split('.')
            if sentences and sentences[0]:
                summary_parts.append(sentences[0].strip())
            else:
                summary_parts.append(text[:100])
        
        summary = "Citizens suggest: " + "; ".join(summary_parts)
        
        return summary[:500]  # Limit length
    
    def cluster_submissions(self, submissions: List[Any]) -> List[Dict]:
        """
        Cluster submissions using DBSCAN algorithm
        Returns list of cluster dictionaries
        """
        if not submissions:
            return []
        
        # Extract texts
        texts = [self.preprocess_text(sub.content) for sub in submissions]
        
        # If too few submissions, put all in one cluster
        if len(texts) < 5:
            keywords = self.extract_keywords(texts)
            return [{
                "theme": self.generate_theme(keywords, texts),
                "summary": self.generate_summary(texts),
                "representative_text": texts[0] if texts else "",
                "keywords": keywords,
                "submission_ids": [sub.id for sub in submissions],
                "confidence_score": 0.95,
                "regions": list(set([sub.region for sub in submissions]))
            }]
        
        # Vectorize texts
        try:
            vectors = self.vectorizer.fit_transform(texts).toarray()
        except Exception as e:
            print(f"Vectorization error: {e}")
            return []
        
        # Reduce dimensionality if needed
        if vectors.shape[1] > 50:
            pca = PCA(n_components=50)
            vectors = pca.fit_transform(vectors)
        
        # Calculate similarity matrix
        similarity_matrix = cosine_similarity(vectors)
        
        # Convert similarity to distance for DBSCAN
        distance_matrix = 1 - similarity_matrix
        
        # Perform clustering
        clustering = DBSCAN(
            eps=0.5,  # Maximum distance between samples
            min_samples=2,  # Minimum cluster size
            metric='precomputed'
        ).fit(distance_matrix)
        
        # Organize submissions by cluster
        clusters = {}
        for idx, label in enumerate(clustering.labels_):
            if label == -1:  # Noise points
                label = 999  # Group noise in a separate cluster
            
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(idx)
        
        # Create cluster dictionaries
        cluster_list = []
        for cluster_id, indices in clusters.items():
            cluster_texts = [texts[i] for i in indices]
            cluster_submissions = [submissions[i] for i in indices]
            
            # Extract keywords for this cluster
            keywords = self.extract_keywords(cluster_texts)
            
            # Generate theme
            theme = self.generate_theme(keywords, cluster_texts)
            
            # Find most representative text (closest to cluster center)
            if len(indices) > 1:
                cluster_vectors = vectors[indices]
                center = np.mean(cluster_vectors, axis=0)
                distances = [np.linalg.norm(v - center) for v in cluster_vectors]
                rep_idx = indices[np.argmin(distances)]
                representative_text = texts[rep_idx]
            else:
                representative_text = cluster_texts[0]
            
            # Calculate confidence score
            if len(indices) > 1:
                cluster_similarities = similarity_matrix[np.ix_(indices, indices)]
                avg_similarity = np.mean(cluster_similarities)
                confidence = min(avg_similarity + 0.3, 1.0)  # Boost and cap at 1.0
            else:
                confidence = 0.7  # Lower confidence for single-item clusters
            
            cluster_dict = {
                "theme": theme,
                "summary": self.generate_summary(cluster_texts),
                "representative_text": representative_text,
                "keywords": keywords,
                "submission_ids": [cluster_submissions[i].id for i in range(len(indices))],
                "confidence_score": round(confidence, 2),
                "regions": list(set([sub.region for sub in cluster_submissions]))
            }
            
            cluster_list.append(cluster_dict)
        
        # Sort by number of submissions (largest clusters first)
        cluster_list.sort(key=lambda x: len(x["submission_ids"]), reverse=True)
        
        return cluster_list
    
    def find_similar_submissions(self, query_text: str, submissions: List[Any], top_k: int = 5):
        """Find submissions similar to a query text"""
        if not submissions:
            return []
        
        # Preprocess query
        query_processed = self.preprocess_text(query_text)
        
        # Preprocess all submission texts
        texts = [self.preprocess_text(sub.content) for sub in submissions]
        
        # Add query to texts for vectorization
        all_texts = [query_processed] + texts
        
        # Vectorize
        try:
            vectors = self.vectorizer.fit_transform(all_texts).toarray()
        except:
            return []
        
        # Calculate similarities
        query_vector = vectors[0]
        submission_vectors = vectors[1:]
        
        similarities = cosine_similarity([query_vector], submission_vectors)[0]
        
        # Get top k indices
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        # Return similar submissions with scores
        results = []
        for idx in top_indices:
            if similarities[idx] > 0.1:  # Minimum similarity threshold
                results.append({
                    "submission": submissions[idx],
                    "similarity_score": round(float(similarities[idx]), 2)
                })
        
        return results
    
    def merge_clusters(self, cluster1: Dict, cluster2: Dict) -> Dict:
        """Merge two similar clusters"""
        merged = {
            "theme": cluster1["theme"],  # Keep first theme or regenerate
            "summary": self.generate_summary(
                [cluster1["summary"], cluster2["summary"]]
            ),
            "representative_text": cluster1["representative_text"],
            "keywords": list(set(cluster1["keywords"] + cluster2["keywords"]))[:10],
            "submission_ids": cluster1["submission_ids"] + cluster2["submission_ids"],
            "confidence_score": (cluster1["confidence_score"] + cluster2["confidence_score"]) / 2,
            "regions": list(set(cluster1["regions"] + cluster2["regions"]))
        }
        
        return merged

# Singleton instance
clustering_service = ClusteringService()

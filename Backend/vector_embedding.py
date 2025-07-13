"""
Vector Embedding Module for PDF RAG Q&A System

This module handles the creation and storage of vector embeddings for PDF documents
using sentence transformers and Pinecone vector database. It provides functionality
for text chunking, embedding generation, and vector storage for semantic search.

"""

import os
import uuid
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec


load_dotenv()

# Get Pinecone configuration from environment variables
PINECONE_API_KEY = os.getenv("PINECONE_DEFAULT_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENVIRONMENT")
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

# BGE model dimension - BAAI/bge-small-en-v1.5 produces 384-dimensional vectors
DIMENSION = 384

# Initialize Pinecone client with API key
pc = Pinecone(api_key=PINECONE_API_KEY)

# Create or connect to the Pinecone index
def init_pinecone():
    """
    Initialize or connect to a Pinecone vector database index.
    """
    try:
        # Check if index already exists in the Pinecone environment
        indexes = pc.list_indexes()
        existing_index_names = [index.name for index in indexes]
        
        if INDEX_NAME not in existing_index_names:
            # Create a new serverless index with optimized configuration
            pc.create_index(
                name=INDEX_NAME,
                dimension=DIMENSION,
                metric="cosine",  # Cosine similarity for semantic search
                spec=ServerlessSpec(
                    cloud="aws",
                    region=PINECONE_ENV
                )
            )
            print(f"Created new Pinecone index: {INDEX_NAME}")
        else:
            print(f"Connected to existing Pinecone index: {INDEX_NAME}")
        
        # Connect to the index and return the client
        index = pc.Index(INDEX_NAME)
        return index
        
    except Exception as e:
        print(f"Error initializing Pinecone: {str(e)}")
        raise



# Initialize BGE (BAAI General Embedding) model for high-quality embeddings
# BGE models are optimized for retrieval tasks and multilingual support
model = SentenceTransformer('BAAI/bge-small-en-v1.5')  

# def prepare_query(query: str) -> str:
#     """
#     Prepare query text for BGE embedding model.
#     BGE models benefit from specific query prefixes that help the model
#     understand the task context and generate better embeddings for retrieval.
#     """
#     return f"Represent this sentence for searching relevant passages: {query}"



def chunk_text(text: str, max_chunk_size: int = 1000, overlap: int = 100) -> List[str]:
    """
    Split long text into smaller, overlapping chunks for better embedding quality.
    
    Breaks down large documents into manageable chunks while preserving context
    through overlapping segments. 
    """
    # Split text into sentences using common sentence-ending punctuation
    import re
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    chunks = []
    current_chunk = []
    current_size = 0

    for sentence in sentences:
        sentence_size = len(sentence)
        
        # Check if adding this sentence would exceed the maximum chunk size
        if current_size + sentence_size > max_chunk_size and current_chunk:
            # Save current chunk and start a new one with overlap
            chunks.append(' '.join(current_chunk))
            
            # Calculate overlap sentences to maintain context
            overlap_size = 0
            overlap_sentences = []
            
            # Work backwards through current chunk to build overlap
            for s in reversed(current_chunk):
                if overlap_size + len(s) <= overlap:
                    overlap_sentences.insert(0, s)
                    overlap_size += len(s)
                else:
                    break
            
            # Start new chunk with overlap sentences for context preservation
            current_chunk = overlap_sentences
            current_size = overlap_size
        
        # Add current sentence to the chunk
        current_chunk.append(sentence)
        current_size += sentence_size

    # Add the final chunk if it contains content
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

def embed_and_store(text_content: List[str], metadata: Dict[str, Any]):
    """
    Process PDF text content into vector embeddings and store in Pinecone.
    
    Takes extracted text from PDF pages, combines them with page context,
    chunks the content appropriately, generates embeddings using BGE model,
    and stores the resulting vectors in Pinecone for semantic search.
    
    """
    try:
        # Initialize Pinecone index connection
        index = init_pinecone()
        
        # Combine all pages with page number context for better retrieval
        combined_text = ""
        for i, page_text in enumerate(text_content):
            combined_text += f"Page {i+1}: {page_text}\n\n"
        
        # Split combined text into manageable, overlapping chunks
        chunks = chunk_text(combined_text)
        
        # Process each chunk into a vector with metadata
        vectors = []
        
        for i, chunk in enumerate(chunks):
            # Generate embedding vector using BGE model
            embedding = model.encode(chunk)
            
            # Create unique identifier for this vector
            vector_id = f"{metadata['filename']}_{i}_{uuid.uuid4()}"
            
            # Prepare comprehensive chunk metadata
            chunk_metadata = {
                **metadata,  # Include all original document metadata
                "chunk_index": i,
                "total_chunks": len(chunks),
                "text_snippet": chunk[:100] + "..."  # Text preview for debugging
            }
            
            # Add vector to batch for storage
            vectors.append({
                "id": vector_id,
                "values": embedding.tolist(),  # Convert numpy array to list
                "metadata": chunk_metadata
            })
        
        # Store vectors in Pinecone using batched uploads for efficiency
        batch_size = 100  # Pinecone recommended batch size
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i+batch_size]
            index.upsert(vectors=batch)
        
        # Return successful processing summary
        return {
            "success": True,
            "vectors_created": len(vectors),
            "filename": metadata['filename']
        }
    
    except Exception as e:
        print(f"Error in embed_and_store: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "vectors_created": 0,
            "filename": metadata.get('filename', 'unknown')
        }

"""
LlamaIndex RAG Implementation for PDF Q&A System

This module provides an alternative RAG implementation using LlamaIndex framework
with Groq LLM and Pinecone vector database. LlamaIndex offers high-level abstractions
for document processing, indexing, and querying.

Key Features:
- LlamaIndex framework for simplified RAG operations
- Groq integration for fast LLM inference
- Pinecone vector store for scalable search
- Consistent BGE embeddings with the main system
- Advanced query processing and response synthesis

This implementation can be used as an alternative to the simple_rag.py module
for scenarios requiring more advanced RAG features.

Author: PDF RAG System
Date: 2024
"""

import os
from typing import Dict, List, Any
from dotenv import load_dotenv
from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.llms.groq import Groq
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from pinecone import Pinecone

# Load environment variables from .env file
load_dotenv()

# Get required API keys
groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key:
    raise ValueError("GROQ_API_KEY environment variable is not set")

def configure_llama_index():
    """
    Configure LlamaIndex with Groq LLM and HuggingFace embeddings.
    
    Sets up the global LlamaIndex settings to use Groq for language model
    operations and BGE embeddings for consistency with the main RAG system.
    
    Returns:
        tuple: (llm, embed_model) - Configured LLM and embedding model instances
        
    Raises:
        Exception: If configuration fails due to API or model issues
    """
    try:
        # Configure Groq LLM for fast inference
        llm = Groq(
            model="llama3-70b-8192",  # High-performance Llama model
            api_key=groq_api_key
        )
        
        # Use BGE embeddings for consistency with main system
        embed_model = HuggingFaceEmbedding(
            model_name="BAAI/bge-small-en-v1.5"
        )
        
        # Configure global LlamaIndex settings
        Settings.llm = llm
        Settings.embed_model = embed_model
        Settings.chunk_size = 1024  # Optimal chunk size for BGE model
        
        return llm, embed_model
        
    except Exception as e:
        print(f"Error configuring LlamaIndex: {str(e)}")
        raise

def get_pinecone_vector_store():
    """
    Connect to Pinecone and create a LlamaIndex vector store wrapper.
    
    Creates a connection to the existing Pinecone index and wraps it
    in a LlamaIndex-compatible vector store interface.
    
    Returns:
        PineconeVectorStore: LlamaIndex vector store connected to Pinecone
        
    Raises:
        Exception: If Pinecone connection fails
    """
    # Initialize Pinecone client with API key
    pc = Pinecone(api_key=os.getenv("PINECONE_DEFAULT_API_KEY"))
    
    # Connect to the configured index
    index_name = os.getenv("PINECONE_INDEX_NAME")
    pinecone_index = pc.Index(index_name)
    
    # Create vector store using LlamaIndex's PineconeVectorStore
    vector_store = PineconeVectorStore(pinecone_index=pinecone_index)
    
    return vector_store

def create_query_engine():
    """Create a RAG query engine using LlamaIndex with Groq and Pinecone"""
    # Configure LlamaIndex
    llm, embed_model = configure_llama_index()
    
    # Get Pinecone vector store
    vector_store = get_pinecone_vector_store()
    
    # Create index from existing vector store
    index = VectorStoreIndex.from_vector_store(vector_store)
    
    # Create query engine with Groq
    query_engine = index.as_query_engine(
        similarity_top_k=3,  # Retrieve top 3 most similar chunks
        response_mode="refine",  # Use refine mode for better answers
    )
    
    return query_engine

def ask_question(question: str) -> Dict[str, Any]:
    """
    Ask a question and get answer with source information using Groq
    
    Args:
        question: The question to ask about the documents
        
    Returns:
        Dict containing answer and source information
    """
    try:
        query_engine = create_query_engine()
        
        # Query the engine
        response = query_engine.query(question)
        
        # Extract source information
        sources = []
        if hasattr(response, 'source_nodes') and response.source_nodes:
            for node in response.source_nodes:
                source_info = {
                    "text_snippet": node.text[:200] + "..." if len(node.text) > 200 else node.text,
                    "score": node.score if hasattr(node, 'score') else None,
                }
                
                # Add any available metadata
                if hasattr(node, 'metadata') and node.metadata:
                    for key in ["filename", "source_url", "page_count", "chunk_index"]:
                        if key in node.metadata:
                            source_info[key] = node.metadata[key]
                
                sources.append(source_info)
        
        return {
            "answer": str(response),
            "sources": sources
        }
    
    except Exception as e:
        print(f"Error in ask_question: {str(e)}")
        raise

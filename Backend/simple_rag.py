"""
Simple RAG (Retrieval-Augmented Generation) Module

This module implements a complete RAG system for PDF Q&A using:
- Pinecone for vector search and document retrieval
- Groq for fast LLM inference with Llama models
- BGE embeddings for semantic similarity matching

The RAG system follows these steps:
1. Query Processing: Embed user questions using BGE model
2. Document Retrieval: Search Pinecone for relevant text chunks
3. Context Assembly: Combine retrieved chunks with source information
4. Answer Generation: Use Groq LLM to generate contextual responses

"""

import os
from typing import Dict, List, Any
import warnings
from dotenv import load_dotenv
from groq import Groq
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

# Load environment variables from .env file
load_dotenv()

# Suppress transformers warnings about deprecated PyTorch functions
warnings.filterwarnings("ignore", message=".*torch.utils._pytree._register_pytree_node.*", category=FutureWarning)



"""Purpose: Sets up all the components needed for RAG:"""
class SimpleRAG:
    
    def __init__(self):
        # Initialize Groq LLM client
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        
        self.groq_client = Groq(api_key=self.groq_api_key)
        
        # Initialize Pinecone vector database
        self.pinecone_api_key = os.getenv("PINECONE_DEFAULT_API_KEY")
        self.index_name = os.getenv("PINECONE_INDEX_NAME")
        
        if not self.pinecone_api_key:
            raise ValueError("PINECONE_DEFAULT_API_KEY environment variable is not set")
        if not self.index_name:
            raise ValueError("PINECONE_INDEX_NAME environment variable is not set")
        
        # Connect to Pinecone index
        pc = Pinecone(api_key=self.pinecone_api_key)
        self.index = pc.Index(self.index_name)
        
        # Initialize BGE embedding model (must match the model used for vectorization)
        self.embedding_model = SentenceTransformer('BAAI/bge-small-en-v1.5')


    
    def prepare_query(self, query: str) -> str:
        """
        Prepare user query for optimal BGE embedding generation.
        
        BGE models perform better with specific query prefixes that help
        the model understand the retrieval task context.
        
        """
        return f"Represent this sentence for searching relevant passages: {query}"
    

    
    
    def retrieve_documents(self, query: str, top_k: int = 3, filename_filter: str = None) -> List[Dict]:
        """
            Converts user question to vector embedding
            Searches Pinecone for similar document chunks
            Optionally filters by specific filename
            Returns most relevant text chunks with metadata
        """
        try:
            # Convert query to vector embedding using BGE model
            prepared_query = self.prepare_query(query)
            query_embedding = self.embedding_model.encode(prepared_query).tolist()
            
            # Prepare Pinecone filter for filename-specific search
            filter_dict = None
            if filename_filter:
                filter_dict = {"filename": {"$eq": filename_filter}}
            
            # Perform semantic search in Pinecone
            search_results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict
            )
            
            # Format search results into standardized document structure
            documents = []
            for match in search_results.get('matches', []):
                doc = {
                    "text": match['metadata'].get('text_snippet', ''),
                    "filename": match['metadata'].get('filename', 'Unknown'),
                    "score": match.get('score', 0.0),
                    "metadata": match.get('metadata', {})
                }
                documents.append(doc)
            
            return documents        
        except Exception as e:
            print(f"Error retrieving documents: {str(e)}")
            return []
    

    # ---------------------------------------------------------------------------------------------------------
    # ---------------------------------------------------------------------------------------------------------
    # GENERATION PART OF LLM
    def generate_answer(self, query: str, documents: List[Dict]) -> str:
        """
        Generate contextual answer using Groq LLM and retrieved documents.
        
        Takes the user's question and relevant document chunks to generate
        a comprehensive, contextual answer using the Llama model via Groq API.
        
        """
        try:
            # Combine retrieved documents into formatted context
            context = "\n\n".join([
                f"Document: {doc['filename']}\nContent: {doc['text']}"
                for doc in documents
            ])     
            
            
            # Crafted optimized prompt for RAG question answering with detailed formatting
            prompt = f"""Based on the following context from uploaded documents, please answer the question in a comprehensive and well-structured format.

            Context:
            {context}

            Question: {query}

            CRITICAL FORMATTING REQUIREMENTS:
            - Break your response into multiple short paragraphs (2-4 sentences each)
            - Add TWO line breaks (\\n\\n) between different paragraphs
            - Use bullet points (•) or numbered lists (1., 2., 3.) when listing multiple items
            - Add blank lines before and after bullet point lists
            - Use clear section headers when discussing different aspects
            - Start each new topic or section with a line break

            CONTENT REQUIREMENTS:
            - Provide detailed explanations with specific examples from the documents
            - Include relevant details, numbers, dates, and names mentioned in the context
            - Organize information logically with clear flow between topics
            - If discussing multiple aspects, address each one separately with proper spacing

            Please provide a detailed, well-formatted response with clear paragraph breaks and proper line spacing:"""
            
            chat_completion = self.groq_client.chat.completions.create(
                messages=[                    {
                        "role": "system",
                        "content": "You are an expert document analyst. ALWAYS format your responses with clear paragraph breaks using double line breaks (\\n\\n) between paragraphs. Use bullet points for lists. Add blank lines before and after lists. Break long explanations into multiple short paragraphs with proper spacing. Never write everything in one single paragraph."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama3-70b-8192",    # High-performance Llama model
                max_tokens=3000,
                temperature=0.2             # Slightly higher temperature for more natural formatting
            )
            
            return chat_completion.choices[0].message.content
        
        except Exception as e:
            print(f"Error generating answer: {str(e)}")
            return f"Sorry, I encountered an error while generating the answer: {str(e)}"




# ============================
# GLOBAL RAG INSTANCE MANAGEMENT
# ============================

# Singleton pattern for RAG system instance
rag_system = None

def get_rag_system():
    """
    Get or create the global RAG system instance.
    
    Implements singleton pattern to ensure only one RAG system
    instance exists throughout the application lifecycle.
      Returns:
        SimpleRAG: Configured RAG system instance
    """
    global rag_system
    if rag_system is None:
        rag_system = SimpleRAG()
    return rag_system




# ============================
# PUBLIC API FUNCTIONS
# ============================



def ask_question(question: str, filename: str = None) -> Dict[str, Any]:
    """
    Main Q&A function for the RAG system.
    
    Processes user questions through the complete RAG pipeline:
    1. Retrieve relevant document chunks
    2. Generate contextual answers
    3. Format response with sources
    """
    try:
        # Get RAG system instance
        rag = get_rag_system()
        
        # Retrieve relevant document chunks (filtered by filename if provided)
        documents = rag.retrieve_documents(question, top_k=3, filename_filter=filename)
        
        # Handle case where no relevant documents are found
        if not documents:
            filter_msg = f" from '{filename}'" if filename else ""
            return {
                "answer": f"I couldn't find any relevant documents{filter_msg} to answer your question. Please make sure you have uploaded and vectorized some PDF documents first.",
                "sources": []
            }
          # Generate contextual answer using retrieved documents
        
        
        answer = rag.generate_answer(question, documents)
          
        # Format source information for response
        sources = []
        for doc in documents:
            source_info = {
                "filename": doc['filename'],
                "text_snippet": doc['text'],
                "score": doc['score']
            }
            
            # Include additional metadata if available
            for key in ["source_url", "page_count", "chunk_index"]:
                if key in doc['metadata']:
                    source_info[key] = doc['metadata'][key]
            
            sources.append(source_info)
        
        return {
            "answer": answer,
            "sources": sources
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "answer": f"Sorry, I encountered an error: {str(e)}",
            "sources": []
        }

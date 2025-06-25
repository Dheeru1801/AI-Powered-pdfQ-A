"""
Database Module for PDF RAG Q&A System

This module provides database operations for managing PDF documents and their metadata
using Supabase as the backend database. It handles document lifecycle management
including upload, processing status updates, and retrieval operations.

Key Features:
- Document record management in Supabase
- Status tracking (uploaded, processing, vectorized, error)
- File metadata storage and retrieval
- Document statistics and analytics
- Comprehensive error handling

Author: PDF RAG System
Date: 2024
"""

import os
from supabase import create_client, Client
from datetime import datetime
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_supabase() -> Client:
    """
    Initialize and return a Supabase client instance.
    
    Retrieves Supabase credentials from environment variables and creates
    a client connection for database operations.
    
    Returns:
        Client: Configured Supabase client instance
        
    Raises:
        Exception: If required environment variables are missing
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Missing required Supabase environment variables")
    
    return create_client(supabase_url, supabase_key)

class DocumentManager:
    """
    Document Management Class for PDF RAG System
    
    Handles all database operations related to document lifecycle management
    including creation, status updates, retrieval, and deletion of document records.
    
    This class provides a clean interface for interacting with the Supabase database
    and maintains consistency in document metadata handling across the application.
    
    Attributes:
        supabase (Client): Supabase client instance for database operations
    """
    
    def __init__(self):
        """
        Initialize DocumentManager with Supabase client.
        
        Establishes connection to Supabase database using environment variables.
        """
        self.supabase = get_supabase()
    
    def create_document_record(self, filename: str, file_size: int, storage_url: str) -> Dict[str, Any]:
        """
        Create a new document record in the Supabase database.
        
        Inserts a new document entry with initial metadata including filename,
        file size, storage information, and sets initial status to 'uploaded'.
        
        Args:
            filename (str): Original filename of the uploaded document
            file_size (int): Size of the file in bytes
            storage_url (str): URL where the file is stored in cloud storage
            
        Returns:
            Dict[str, Any]: Created document record with all metadata
            
        Raises:
            Exception: If database insertion fails
        """
        try:
            # Prepare document metadata for insertion
            document_data = {
                "filename": filename,
                "original_filename": filename,
                "file_size": file_size,
                "mime_type": "application/pdf",  # Currently only supporting PDFs
                "storage_path": f"pdf-file/{filename}",
                "storage_url": storage_url,
                "status": "uploaded"  # Initial status after upload
            }
            
            # Insert document record into database
            result = self.supabase.table("documents").insert(document_data).execute()
            
            if not result.data:
                raise Exception("No data returned from document creation")
                
            return result.data[0]
            
        except Exception as e:
            print(f"Error creating document record: {str(e)}")
            raise
    
    def update_document_status(self, filename: str, status: str, **kwargs) -> None:
        """
        Update document status and additional metadata.
        
        Updates the document record with new status and any additional metadata
        provided through kwargs. Commonly used for tracking processing pipeline
        progress (uploaded -> processing -> vectorized -> error).
        
        Args:
            filename (str): Document filename to update
            status (str): New status ('uploaded', 'processing', 'vectorized', 'error')
            **kwargs: Additional metadata fields to update
            
        Raises:
            Exception: If database update fails
        """        # Prepare update data with status and additional fields
        update_data = {"status": status}
        update_data.update(kwargs)
        
        try:
            # Update document record by filename
            result = self.supabase.table("documents").update(update_data).eq("filename", filename).execute()
            
            if not result.data:
                print(f"Warning: No document found with filename '{filename}' to update")
                
        except Exception as e:
            print(f"Error updating document status: {str(e)}")
            raise
    
    def get_document(self, filename: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a single document record by filename.
        
        Fetches complete document metadata from the database for a specific filename.
        Used for checking document existence and retrieving metadata before operations.
        
        Args:
            filename (str): Document filename to search for
            
        Returns:
            Optional[Dict[str, Any]]: Document record if found, None otherwise
        """
        try:
            result = self.supabase.table("documents").select("*").eq("filename", filename).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            else:
                return None
                
        except Exception as e:
            print(f"Error getting document: {str(e)}")
            return None
    
    def list_documents(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List all documents with optional status filtering.
        
        Retrieves all document records from the database, optionally filtered by status.
        Results are ordered by upload date (most recent first) for better UX.
        
        Args:
            status (Optional[str]): Filter by document status if provided
            
        Returns:
            List[Dict[str, Any]]: List of document records matching criteria
        """
        try:
            # Build query with optional status filter
            query = self.supabase.table("documents").select("*").order("uploaded_at", desc=True)
            
            if status:
                query = query.eq("status", status)
            
            result = query.execute()
            return result.data if result.data else []
            
        except Exception as e:
            print(f"Error listing documents: {str(e)}")
            return []
    
    def get_vectorized_documents(self) -> List[Dict[str, Any]]:
        """
        Get only documents that have been successfully vectorized.
        
        Convenience method to retrieve documents that are ready for Q&A operations.
        These documents have completed the vectorization process and are available
        for semantic search and question answering.
        
        Returns:
            List[Dict[str, Any]]: List of vectorized document records        """
        return self.list_documents(status="vectorized")
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Calculate and return comprehensive document statistics.
        
        Aggregates data across all documents to provide insights into the
        document collection including counts by status, total storage usage,
        and processing metrics.
        
        Returns:
            Dict[str, Any]: Dictionary containing document statistics including:
                - total_documents: Total number of documents
                - uploaded: Count of newly uploaded documents
                - processing: Count of documents being processed
                - vectorized: Count of ready-to-use documents
                - error: Count of documents with processing errors
                - total_size_mb: Total storage used in megabytes
        """
        try:
            # Fetch all documents for statistics calculation
            all_docs = self.list_documents()
            
            # Calculate comprehensive statistics
            stats = {
                "total_documents": len(all_docs),
                "uploaded": len([d for d in all_docs if d["status"] == "uploaded"]),
                "processing": len([d for d in all_docs if d["status"] == "processing"]),
                "vectorized": len([d for d in all_docs if d["status"] == "vectorized"]),
                "error": len([d for d in all_docs if d["status"] == "error"]),
                "total_size_mb": round(sum(d["file_size"] for d in all_docs) / 1024 / 1024, 2)
            }
            
            return stats
            
        except Exception as e:
            print(f"Error getting statistics: {str(e)}")
            return {}
    
    def delete_document(self, filename: str) -> bool:
        """
        Delete a document record from the database.
        
        Removes the document metadata from the database. Note that this only
        deletes the database record and does not remove the actual file from
        cloud storage or vector embeddings from Pinecone.
        
        Args:
            filename (str): Filename of the document to delete
            
        Returns:
            bool: True if deletion was successful, False otherwise
        """
        try:
            # Delete document record by filename
            result = self.supabase.table("documents").delete().eq("filename", filename).execute()
            
            # Check if any records were actually deleted
            if result.data is not None:
                return True
            else:
                print(f"Warning: No document found with filename '{filename}' to delete")
                return False
                
        except Exception as e:
            print(f"Error deleting document: {str(e)}")
            return False

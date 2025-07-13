"""
PDF RAG Q&A System - FastAPI Backend

This module implements a comprehensive PDF upload, processing, and question-answering system.
It provides REST API endpoints for:
- PDF file upload and storage (Supabase)
- Text extraction and vectorization (Pinecone)
- Document search and retrieval
- RAG-based question answering

Dependencies:
- FastAPI: Web framework for building APIs
- Supabase: Cloud storage for PDF files and metadata
- Pinecone: Vector database for semantic search
- BAAI/bge-base-en-v1.5: Embedding model for text vectorization
- Groq: LLM API for generating answers

"""

# Fix OpenMP library conflict before importing ML libraries
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Fix HuggingFace compatibility issues
os.environ["TRANSFORMERS_OFFLINE"] = "0"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"

# Standard library imports
import io
from datetime import datetime
from typing import List, Optional, Dict, Any

# Third-party imports
import uvicorn
from pypdf import PdfReader
from fastapi import FastAPI, File, UploadFile, HTTPException, Path, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

# Local imports
from database import DocumentManager




# ================================
# CONFIGURATION AND SETUP
# ================================

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI application
app = FastAPI(
    title="PDF RAG Q&A System API",
    description="Backend API for PDF upload, vectorization, and question-answering system",
    version="1.0.0"
)

# Configure CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://0.0.0.0:5173",
        "https://ai-powered-pdf-q-a.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




# ================================
# ENVIRONMENT VARIABLES
# ================================

# Supabase configuration - cloud storage and database
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET_NAME = os.getenv("BUCKET_NAME", "pdf-uploads")  # Default bucket name

# Validate required environment variables
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        " Supabase credentials not found. Please ensure your .env file contains:\n"
        "   - SUPABASE_URL\n"
        "   - SUPABASE_KEY\n"
        "   - BUCKET_NAME (optional, defaults to 'pdf-uploads')"
    )

# ================================
# DEPENDENCY INJECTION
# ================================

def get_supabase() -> Client:
    """
    Dependency injection function to create Supabase client.
    
    Returns:
        Client: Initialized Supabase client for database and storage operations
    """
    return create_client(SUPABASE_URL, SUPABASE_KEY)






# ================================
# API ENDPOINTS
# ================================

@app.get("/")
def read_root():
    return {"message": "PDF RAG Q&A Backend is running"}



# ------------------------------------------------------------------------------------------------
# ------------------------------------------------------------------------------------------------

# 📤 Upload PDF File Endpoint    
# Handles PDF file uploads to Supabase Storage and creates database records.
@app.post("/uploadpdf/")
async def upload_pdf(
    file: UploadFile = File(...),
    supabase: Client = Depends(get_supabase)
):
    
    """Validate file type and ensure it is a PDF"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400, 
            detail=" Only PDF files are allowed. Please upload a .pdf file."
        )
    
    filename = file.filename
    doc_manager = DocumentManager()
    
    """Check for duplicate/existing documents"""
    existing_doc = doc_manager.get_document(filename)
    if existing_doc:
        raise HTTPException(
            status_code=400, 
            detail=f" Document '{filename}' already exists in the system."
        )
    """Ensure storage bucket exists (create if needed)"""
    try:
        buckets = supabase.storage.list_buckets()
        bucket_exists = any(
            (hasattr(bucket, 'name') and bucket.name == BUCKET_NAME) or
            (isinstance(bucket, dict) and bucket.get('name') == BUCKET_NAME)
            for bucket in buckets
        )
                
        if not bucket_exists:
            supabase.storage.create_bucket(BUCKET_NAME, {"public": True})
            
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f" Error managing storage bucket: {str(e)}"
        )
    
    """Upload file to Supabase Storage"""
    try:       
        file_content = await file.read()
        file_size = len(file_content)
        
        response = supabase.storage.from_(BUCKET_NAME).upload(
            filename,
            file_content,
            {"content-type": "application/pdf"}        )
        
        # Generate public URL for the uploaded file
        file_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)


        """Create database record with metadata""" 
        doc_record = doc_manager.create_document_record(filename, file_size, file_url)
        
        return {
            "filename": filename,
            "status": "success",
            "message": f" PDF '{filename}' uploaded successfully", "url": file_url,
            "document_id": doc_record["id"],
            "database_status": doc_record["status"],
            "file_size_bytes": file_size
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f" Upload failed: {str(e)}"
        )




# ------------------------------------------------------------------------------------------------
# ------------------------------------------------------------------------------------------------




"""Returns a list of uploaded PDF files from database"""
@app.get("/api/files")
async def list_files_json(limit: int = 10, search: str = None):
    try:
        doc_manager = DocumentManager()
        all_files = doc_manager.list_documents()
        
        # Sort by created_at descending (most recent first)
        all_files.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        # If search term is provided, filter files
        if search:
            search_term = search.lower()
            filtered_files = [
                file for file in all_files 
                if search_term in file.get('filename', '').lower()            ]
            return {
                "files": filtered_files,
                "count": len(filtered_files),
                "search_term": search,
                "total_files": len(all_files)            }
        
        
        recent_files = all_files[:limit]
        
        return {
            "files": recent_files,
            "count": len(recent_files),
            "total_files": len(all_files),
            "showing_recent": limit
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching files: {str(e)}")



# ------------------------------------------------------------------------------------------------
# ------------------------------------------------------------------------------------------------


"""
    Extract text from a PDF file stored in Supabase Storage
"""

@app.get("/extract/{filename}")
async def extract_pdf_text(filename: str, supabase: Client = Depends(get_supabase)):
    
    """ Check if document exists in database"""
    doc_manager = DocumentManager()
    document = doc_manager.get_document(filename)
    if not document:
        raise HTTPException(status_code=404, detail=f"Document '{filename}' not found in database")
    
    try:
        # Download file data from Supabase Storage directly into memory
        try:
            file_data = supabase.storage.from_(BUCKET_NAME).download(filename)
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"File '{filename}' not found in storage: {str(e)}"
            )
        
        # Extract text from the PDF data in memory
        try:
            file_stream = io.BytesIO(file_data)
            pdf_reader = PdfReader(file_stream)
            
            text_content = []
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text_content.append(page.extract_text())
                
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error extracting text from PDF: {str(e)}"
            )
        
        return {
            "filename": filename,
            "page_count": len(text_content),
            "text_content": text_content
        }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))





# ------------------------------------------------------------------------------------------------
# ------------------------------------------------------------------------------------------------




"""
    Extract text from a PDF in Supabase Storage, vectorize it using BGE model, and store in Pinecone
"""
@app.post("/vectorize/{filename}")
async def vectorize_pdf(
    filename: str, 
    supabase: Client = Depends(get_supabase)
):
    doc_manager = DocumentManager()
    
    try:
        # Update status to processing
        doc_manager.update_document_status(filename, "processing")
        
        # Use extract endpoint to get text content
        try:
            extract_result = await extract_pdf_text(filename, supabase)
            text_content = extract_result["text_content"]
        except HTTPException as e:
            if e.status_code == 404:
                doc_manager.update_document_status(filename, "error", error_message=f"File not found: {e.detail}")
            else:
                doc_manager.update_document_status(filename, "error", error_message=f"Text extraction failed: {e.detail}")
            raise
        
        # Get the public URL for the PDF
        file_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
        
        
        """
        Import the vector embedding module
        
        1. Initialize Pinecone connection
        2. Combine pages with page number context
        3. Split into overlapping chunks
        4. Generate embeddings for each chunk
        5. Store vectors in Pinecone with metadata
        6. Return processing summary
        """ 
        from vector_embedding import embed_and_store
        
        # Define metadata
        metadata = {
            "filename": filename,
            "source_url": file_url,
            "page_count": len(text_content),
            "processed_date": datetime.now().isoformat()
        }
        
        # Process and store vectors
        result = embed_and_store(text_content, metadata)
        
        # Calculate text statistics
        page_count = len(text_content)
        total_text_length = sum(len(page) for page in text_content)
        
        
        # Update status to vectorized with metadata
        doc_manager.update_document_status(
            filename, 
            "vectorized",
            vectorized_at=datetime.now().isoformat(),
            page_count=page_count,
            text_length=total_text_length,
            chunk_count=result["vectors_created"]
        )
        
        return {
            "success": True,
            "message": f"PDF successfully vectorized and stored in Pinecone",
            "filename": filename,
            "vectors_created": result["vectors_created"],
            "page_count": page_count,
            "text_length": total_text_length,
            "chunk_count": result["vectors_created"]
        }
        
    except Exception as e:
        # Update status to error if not already updated
        try:
            doc_manager.update_document_status(filename, "error", error_message=str(e))
        except:
            pass  # Don't fail if database update fails
        raise HTTPException(
            status_code=500,
            detail=f"Error vectorizing PDF: {str(e)}"
        )



# ------------------------------------------------------------------------------------------------
# ------------------------------------------------------------------------------------------------




# @app.get("/search/")
# async def search_documents(
#     query: str,
#     top_k: int = 5
# ):
#     """
#     Search for documents similar to the query using BAAI embeddings
#     """
#     try:
#         # Import from the vector embedding module
#         from vector_embedding import model, init_pinecone, prepare_query
        
#         # Generate embedding for the query with proper prefix for BGE models
#         prepared_query = prepare_query(query)
#         query_embedding = model.encode(prepared_query).tolist()
        
#         # Initialize Pinecone and search
#         index = init_pinecone()
        
#         # Search for similar vectors
#         search_results = index.query(
#             vector=query_embedding,
#             top_k=top_k,
#             include_metadata=True
#         )
        
#         # Format results
#         results = []
#         for match in search_results['matches']:
#             results.append({
#                 "score": match['score'],
#                 "filename": match['metadata']['filename'],
#                 "text_snippet": match['metadata']['text_snippet'],
#                 "source_url": match['metadata'].get('source_url', ''),
#                 "page_count": match['metadata'].get('page_count', 0)
#             })
#           # Return results as JSON
#         return {
#             "query": query,
#             "results": results,
#             "total_results": len(results)
#         }
        
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error during search: {str(e)}"        )



# ------------------------------------------------------------------------------------------------
# ------------------------------------------------------------------------------------------------



@app.post("/api/ask")
async def ask_question_api(question: Dict[str, str]):
    """
        Answer a question about the documents using RAG (API endpoint)
    """
    try:
        if "text" not in question:
            raise HTTPException(status_code=400, detail="Question text is required")
            
        # Import the simple RAG module
        from simple_rag import ask_question as rag_ask_question
        
        # Get filename if provided
        filename = question.get("filename", None)
        
        # Get the answer (with optional filename filtering)
        result = rag_ask_question(question["text"], filename=filename)
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating answer: {str(e)}"
        )



# ------------------------------------------------------------------------------------------------
# ------------------------------------------------------------------------------------------------


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
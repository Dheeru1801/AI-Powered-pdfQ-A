"""
Pre-download and cache the BGE model to avoid hanging during first request
"""
import os
from sentence_transformers import SentenceTransformer

print("Pre-downloading BGE model to avoid first-request hanging...")
print("This may take a few minutes on first run.")

try:
    # This will download and cache the model
    model = SentenceTransformer('BAAI/bge-small-en-v1.5')
    print("✅ Model downloaded and cached successfully!")
    
    # Test the model
    test_text = "This is a test sentence for embedding."
    embedding = model.encode(test_text)
    print(f"✅ Model test successful - embedding shape: {embedding.shape}")
    
except Exception as e:
    print(f"❌ Error downloading model: {e}")
    print("You may need to:")
    print("1. Check your internet connection")
    print("2. Clear the transformers cache: ~/.cache/huggingface/")
    print("3. Try a different model or use a local model path")

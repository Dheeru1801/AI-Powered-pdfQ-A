#!/usr/bin/env python3
"""
Cleanup script to remove conflicting packages and install clean dependencies
"""
import subprocess
import sys

def run_command(command):
    """Run a command and return success status"""
    try:
        print(f"Running: {' '.join(command)}")
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print(f"✅ Success: {result.stdout.strip() if result.stdout.strip() else 'Command completed'}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e.stderr.strip() if e.stderr.strip() else str(e)}")
        return False

def main():
    print("🧹 Starting cleanup and reinstallation process...\n")
    
    # Step 1: Remove all LlamaIndex related packages
    print("Step 1: Removing conflicting LlamaIndex packages...")
    llamaindex_packages = [
        "llama-cloud-services",
        "llama-index-indices-managed-llama-cloud", 
        "llama-index-core",
        "llama-index",
        "llama-index-llms-groq",
        "llama-index-embeddings-huggingface",
        "llama-index-vector-stores-pinecone"
    ]
    
    for package in llamaindex_packages:
        run_command([sys.executable, "-m", "pip", "uninstall", package, "-y"])
    
    print("\n" + "="*50)
    
    # Step 2: Update python-dotenv to fix version conflict
    print("\nStep 2: Updating python-dotenv...")
    run_command([sys.executable, "-m", "pip", "install", "--upgrade", "python-dotenv>=1.0.1"])
    
    print("\n" + "="*50)
    
    # Step 3: Install our clean requirements
    print("\nStep 3: Installing clean requirements...")
    packages = [
        "fastapi==0.104.1",
        "uvicorn==0.24.0", 
        "python-multipart==0.0.6",
        "jinja2==3.1.2",
        "python-dotenv>=1.0.1",
        "PyPDF2==3.0.1",
        "supabase==2.0.3",
        "pinecone-client==3.0.0",
        "sentence-transformers==2.2.2",
        "groq==0.4.1"
    ]
    
    for package in packages:
        if not run_command([sys.executable, "-m", "pip", "install", package]):
            print(f"Failed to install {package}")
            return False
    
    print("\n" + "="*50)
    
    # Step 4: Verify installation
    print("\nStep 4: Verifying installation...")
    verification_packages = ["fastapi", "groq", "pinecone", "sentence_transformers", "supabase"]
    
    for package in verification_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package} imported successfully")
        except ImportError as e:
            print(f"❌ {package} import failed: {e}")
            return False
    
    print("\n🎉 Cleanup and installation completed successfully!")
    print("\nYou can now run:")
    print("  python test_groq.py")
    print("  python test_pinecone.py") 
    print("  python main.py")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        print("\n❌ Cleanup failed. You may need to manually remove packages.")
        sys.exit(1)

#!/bin/bash
# install_packages.py - Step by step installation to avoid dependency conflicts

import subprocess
import sys

def install_package(package):
    """Install a single package"""
    try:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ Successfully installed {package}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install {package}: {e}")
        return False

def main():
    # Core packages first
    core_packages = [
        "fastapi==0.104.1",
        "uvicorn==0.24.0", 
        "python-multipart==0.0.6",
        "PyPDF2==3.0.1",
        "supabase==2.0.3",
        "python-dotenv==1.0.0",
        "jinja2==3.1.2"
    ]
    
    # Install core packages
    print("📦 Installing core packages...")
    for package in core_packages:
        if not install_package(package):
            print(f"Failed to install core package: {package}")
            return False
    
    # Vector and ML packages
    ml_packages = [
        "pinecone-client==3.0.0",
        "sentence-transformers==2.2.2",
        "groq==0.4.1"
    ]
    
    print("\n🤖 Installing ML packages...")
    for package in ml_packages:
        if not install_package(package):
            print(f"Failed to install ML package: {package}")
            return False
    
    # LlamaIndex packages (install core first)
    llamaindex_packages = [
        "llama-index-core==0.10.0",
        "llama-index-llms-groq==0.1.3",
        "llama-index-embeddings-huggingface==0.2.0",
        "llama-index-vector-stores-pinecone==0.1.3"
    ]
    
    print("\n🦙 Installing LlamaIndex packages...")
    for package in llamaindex_packages:
        if not install_package(package):
            print(f"Failed to install LlamaIndex package: {package}")
            return False
    
    print("\n✅ All packages installed successfully!")
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 Installation complete! You can now run your application.")
    else:
        print("\n❌ Installation failed. Check the errors above.")

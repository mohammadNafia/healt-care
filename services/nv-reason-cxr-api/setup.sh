#!/bin/bash

# Setup script for NV-Reason-CXR API

echo "Setting up NV-Reason-CXR API backend..."

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create .env from example if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp env.example .env
    echo "Please edit .env with your configuration"
fi

echo "Setup complete!"
echo "To run the service:"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --reload --port 8000"

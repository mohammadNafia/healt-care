# CXR AI Integration Guide

This document provides instructions for setting up and running the CXR AI feature, which integrates the NVIDIA NV-Reason-CXR-3B model with your Next.js frontend.

## Project Structure

```
full heal/
├── healt-care/              # Next.js frontend
│   ├── app/
│   │   ├── cxr-ai/         # New CXR AI page
│   │   ├── dashboard/      # Existing dashboard
│   │   └── page.tsx        # Homepage (updated with CXR AI link)
│   └── .env.local.example  # Frontend environment config
│
└── services/
    └── nv-reason-cxr-api/  # FastAPI backend service
        ├── main.py         # FastAPI application
        ├── model_runner.py # Model loading and inference
        ├── requirements.txt
        ├── env.example     # Backend environment config
        ├── Dockerfile
        └── README.md
```

## Prerequisites

1. **Python 3.11+** (for backend)
2. **Node.js 18+** (for frontend)
3. **CUDA-capable GPU** (optional, but recommended for faster inference)
4. **Hugging Face account** (to access the model)

## Setup Instructions

### 1. Backend Setup

1. **Navigate to backend directory:**
```bash
cd services/nv-reason-cxr-api
```

2. **Create virtual environment:**
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment:**
```bash
# Copy the example file
cp env.example .env

# Edit .env with your settings:
# - HF_MODEL_NAME=nvidia/NV-Reason-CXR-3B (default)
# - HF_TOKEN=your_token_if_needed (optional)
# - DEVICE=cuda (auto-detected)
# - MAX_NEW_TOKENS=1024 (default)
# - PORT=8000 (default)
# - CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

5. **Run the backend service:**
```bash
# Option 1: Using uvicorn directly
uvicorn main:app --reload --port 8000

# Option 2: Using Python script
python main.py
```

The backend will:
- Load the model on startup (this may take a few minutes)
- Be available at `http://localhost:8000`
- Provide API documentation at `http://localhost:8000/docs`

### 2. Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd healt-care
```

2. **Install dependencies (if not already done):**
```bash
npm install
```

3. **Configure environment:**
```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

4. **Run the frontend:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 3. Accessing CXR AI

Once both services are running:

1. **From Homepage:** Click the "CXR AI" button in the navigation or in the CTA section
2. **From Dashboard:** Click the "CXR AI" button in the navigation bar
3. **Direct URL:** Navigate to `http://localhost:3000/cxr-ai`

## Usage

1. **Upload an X-ray image:**
   - Click the upload area or drag and drop
   - Supported formats: PNG, JPG (max 10MB)

2. **Customize prompt (optional):**
   - Default: "Find abnormalities and support devices."
   - You can modify the prompt for different analysis types

3. **Click "Analyze X-Ray":**
   - The image will be sent to the backend
   - Analysis may take 10-60 seconds depending on hardware
   - Results will appear in the right panel

4. **Review results:**
   - View the AI-generated analysis
   - Check model info and processing time
   - Read the medical disclaimer

## API Endpoints

### `POST /api/cxr/analyze`

Analyze a chest X-ray image.

**Request:**
- `image`: Multipart file (PNG/JPG, max 10MB)
- `prompt`: Text prompt (optional, default: "Find abnormalities and support devices.")

**Response:**
```json
{
  "ok": true,
  "model": "nvidia/NV-Reason-CXR-3B",
  "output_text": "Detailed analysis text...",
  "runtime": {
    "device": "cuda",
    "seconds": 3.2
  },
  "disclaimer": "For research/education only. Not a medical diagnosis."
}
```

## Troubleshooting

### Backend Issues

1. **Model loading fails:**
   - Check your internet connection (model downloads from Hugging Face)
   - Verify `HF_TOKEN` if the model requires authentication
   - Check available disk space (model is ~6GB)

2. **CUDA errors:**
   - The service will automatically fall back to CPU
   - CPU inference is slower but functional
   - Check CUDA installation if you want GPU acceleration

3. **Port already in use:**
   - Change `PORT` in `.env` to a different port
   - Update `NEXT_PUBLIC_API_BASE_URL` in frontend `.env.local`

### Frontend Issues

1. **CORS errors:**
   - Ensure backend `CORS_ORIGINS` includes your frontend URL
   - Check that backend is running

2. **API connection fails:**
   - Verify `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
   - Check that backend is running on the correct port
   - Check browser console for detailed error messages

## Docker Deployment (Optional)

### Backend Docker

```bash
cd services/nv-reason-cxr-api
docker build -t nv-reason-cxr-api .
docker run -p 8000:8000 --env-file .env nv-reason-cxr-api
```

## Performance Notes

- **First request:** Model loading happens at startup, so first inference may be slower
- **GPU vs CPU:** GPU inference is 5-10x faster than CPU
- **Model size:** ~6GB, ensure sufficient RAM/VRAM
- **Inference time:** Typically 3-10 seconds on GPU, 30-60 seconds on CPU

## Alternative: Hugging Face Space (No Local GPU)

If you cannot run the model locally, you can use the Hugging Face Space as a proxy:

1. **Install Gradio client in backend:**
```bash
pip install gradio-client
```

2. **Update backend to use HF Space:**
   - Modify `model_runner.py` to use `@gradio/client` instead
   - Set `USE_HF_SPACE=true` in `.env`

This approach doesn't require local GPU but has rate limits and may be slower.

## Medical Disclaimer

**Important:** This tool is for research and educational purposes only. It does not replace professional medical advice, diagnosis, or treatment. Always consult qualified healthcare professionals for medical decisions.

## Support

For issues with:
- **Model/Backend:** Check `services/nv-reason-cxr-api/README.md`
- **Frontend:** Check Next.js documentation
- **Model details:** See `NV-Reason-CXR/README.md`

## File Tree

After setup, your project structure should include:

```
full heal/
├── healt-care/
│   ├── app/
│   │   ├── cxr-ai/
│   │   │   └── page.tsx          # NEW: CXR AI page
│   │   ├── dashboard/
│   │   │   └── page.tsx          # UPDATED: Added CXR AI link
│   │   └── page.tsx              # UPDATED: Added CXR AI link
│   ├── .env.local.example        # NEW: Frontend env template
│   └── package.json
│
└── services/
    └── nv-reason-cxr-api/
        ├── main.py               # NEW: FastAPI app
        ├── model_runner.py       # NEW: Model inference
        ├── requirements.txt      # NEW: Python dependencies
        ├── env.example           # NEW: Backend env template
        ├── Dockerfile            # NEW: Docker config
        └── README.md             # NEW: Backend docs
```

## Run Commands Summary

**Terminal 1 - Backend:**
```bash
cd services/nv-reason-cxr-api
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd healt-care
npm install  # If not already done
npm run dev
```

Then open `http://localhost:3000/cxr-ai` in your browser.

# NV-Reason-CXR API Service

FastAPI backend service for NVIDIA NV-Reason-CXR-3B model inference.

## Setup

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Run the service:**
```bash
uvicorn main:app --reload --port 8000
```

Or use the Python script:
```bash
python main.py
```

## Environment Variables

- `HF_MODEL_NAME`: Hugging Face model name (default: `nvidia/NV-Reason-CXR-3B`)
- `HF_TOKEN`: Hugging Face token (optional, if model requires authentication)
- `DEVICE`: Device to use (`cuda` or `cpu`, auto-detected if not set)
- `MAX_NEW_TOKENS`: Maximum tokens to generate (default: 1024)
- `PORT`: Server port (default: 8000)
- `CORS_ORIGINS`: Comma-separated list of allowed CORS origins

## API Endpoints

### `GET /`
Health check endpoint.

### `GET /health`
Health check with model status.

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
  "output_text": "...",
  "runtime": {
    "device": "cuda",
    "seconds": 3.2
  },
  "disclaimer": "For research/education only. Not a medical diagnosis."
}
```

## Docker

Build and run with Docker:
```bash
docker build -t nv-reason-cxr-api .
docker run -p 8000:8000 --env-file .env nv-reason-cxr-api
```

## Notes

- Model is loaded once at startup (cold-start caching)
- CUDA is automatically detected; falls back to CPU if unavailable
- File validation: PNG/JPG only, 10MB max size
- CORS is enabled for frontend domains

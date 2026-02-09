# AI Medical Center - Setup Guide

This guide will help you set up and run the AI Medical Center with all four medical AI tools.

## Overview

The AI Medical Center includes:
1. **X-ray (CXR)** - Local backend using NV-Reason-CXR model
2. **Skin** - Hugging Face Space (iframe embed)
3. **Brain** - Hugging Face Space (iframe embed)
4. **Breast** - Hugging Face Space (iframe embed)

## Prerequisites

- Python 3.8+ (for backend)
- Node.js 18+ (for frontend)
- CUDA-capable GPU (optional, for faster X-ray analysis)

## Step 1: Backend Setup (X-ray Model)

### 1.1 Navigate to Backend Directory

```bash
cd services/nv-reason-cxr-api
```

### 1.2 Create Virtual Environment

**Windows:**
```powershell
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 1.3 Install Dependencies

```bash
pip install -r requirements.txt
```

### 1.4 Configure Environment (Optional)

Create a `.env` file if you need to customize settings:

```env
HF_MODEL_NAME=nvidia/NV-Reason-CXR-3B
HF_TOKEN=your_huggingface_token_if_needed
PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
MAX_NEW_TOKENS=1024
```

### 1.5 Run Backend Server

```bash
uvicorn main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Loading NV-Reason-CXR model...
INFO:     Model loaded successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Note:** First-time model loading may take several minutes as it downloads the model from Hugging Face.

## Step 2: Frontend Setup

### 2.1 Navigate to Frontend Directory

```bash
cd healt-care
```

### 2.2 Install Dependencies (if not already done)

```bash
npm install
```

### 2.3 Configure Environment

Create `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**Note:** If your backend runs on a different port, update the URL accordingly.

### 2.4 Run Frontend Server

```bash
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000
- Local:        http://localhost:3000
```

## Step 3: Access AI Medical Center

1. Open your browser: `http://localhost:3000`
2. Click **"AI Medical Center"** in the navigation bar
3. Or navigate directly to: `http://localhost:3000/ai-medical-center`

## Step 4: Using the Tools

### X-ray Tab (Local Backend)

1. Click the **"X-ray (CXR)"** tab
2. Upload a chest X-ray image (PNG or JPG, max 10MB)
3. Optionally modify the analysis prompt
4. Click **"Analyze X-Ray"**
5. Wait for analysis (may take 10-60 seconds depending on hardware)
6. Review the results

### Skin, Brain, Breast Tabs (Hugging Face Spaces)

1. Click the respective tab (Skin, Brain, or Breast)
2. The Hugging Face Space will load in an iframe
3. Use the embedded tool directly
4. Note: These tools are hosted on Hugging Face and may have rate limits

## Troubleshooting

### Backend Issues

**Model loading fails:**
- Check internet connection (model downloads from Hugging Face)
- Verify you have enough disk space (~6GB for the model)
- Check if you need a Hugging Face token (set `HF_TOKEN` in `.env`)

**CUDA errors:**
- The backend will automatically fall back to CPU if CUDA is unavailable
- CPU inference is slower but will work

**Port already in use:**
- Change the port in the uvicorn command: `--port 8001`
- Update `NEXT_PUBLIC_API_BASE_URL` in frontend `.env.local`

### Frontend Issues

**Cannot connect to backend:**
- Verify backend is running on port 8000
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Ensure CORS is configured correctly in backend

**Hugging Face iframes not loading:**
- Check internet connection
- Some browsers may block iframes from external sources
- Try a different browser or disable strict privacy settings

## File Structure

```
full heal/
├── services/
│   └── nv-reason-cxr-api/          # Backend service
│       ├── main.py                  # FastAPI app
│       ├── model_runner.py          # Model inference
│       ├── requirements.txt         # Python dependencies
│       └── .env                      # Backend config (create if needed)
│
├── healt-care/                      # Next.js frontend
│   ├── app/
│   │   ├── ai-medical-center/       # NEW: AI Medical Center page
│   │   │   └── page.tsx             # Main page with tabs
│   │   ├── cxr-ai/                  # Existing CXR AI page (still available)
│   │   └── ...
│   └── .env.local                   # Frontend config (create this)
│
└── AI_MEDICAL_CENTER_SETUP.md       # This file
```

## API Endpoints

### `POST /api/cxr/analyze`

Analyze a chest X-ray image.

**Request:**
- `image`: Multipart file (PNG/JPG, max 10MB)
- `prompt`: Text prompt (optional, default: "Analyze this chest X-ray and list findings and devices.")

**Response:**
```json
{
  "ok": true,
  "model": "nvidia/NV-Reason-CXR-3B",
  "output_text": "Analysis results...",
  "runtime": {
    "device": "cuda",
    "seconds": 12.34
  },
  "disclaimer": "For research/education only. Not a medical diagnosis."
}
```

## Medical Disclaimer

**IMPORTANT:** All AI tools in the AI Medical Center are for research and educational purposes only. They do not replace professional medical advice, diagnosis, or treatment. Always consult qualified healthcare professionals for medical decisions.

## Support

- **Backend issues:** Check `services/nv-reason-cxr-api/README.md`
- **Frontend issues:** Check Next.js documentation
- **Model details:** See `NV-Reason-CXR/README.md`

## Quick Start Commands

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

Then open: `http://localhost:3000/ai-medical-center`

# Quick Start Guide - CXR AI Integration

## 🚀 Quick Setup (5 minutes)

### Backend Setup

```bash
# Navigate to backend
cd services/nv-reason-cxr-api

# Windows
setup.bat

# Linux/Mac
chmod +x setup.sh
./setup.sh

# Or manually:
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cp env.example .env
# Edit .env if needed

# Run backend
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend
cd healt-care

# Install dependencies (if not done)
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local

# Run frontend
npm run dev
```

### Access

1. Open browser: `http://localhost:3000`
2. Click "CXR AI" button in navigation
3. Or go directly to: `http://localhost:3000/cxr-ai`

## 📁 File Structure

```
full heal/
├── services/nv-reason-cxr-api/     # Backend service
│   ├── main.py                      # FastAPI app
│   ├── model_runner.py              # Model inference
│   ├── requirements.txt            # Python deps
│   ├── env.example                  # Env template
│   ├── Dockerfile                   # Docker config
│   └── README.md                    # Backend docs
│
├── healt-care/                      # Next.js frontend
│   ├── app/
│   │   ├── cxr-ai/page.tsx          # NEW: CXR AI page
│   │   ├── dashboard/page.tsx       # UPDATED: Added link
│   │   └── page.tsx                 # UPDATED: Added link
│   └── .env.local                   # Frontend config (create this)
│
└── INTEGRATION_README.md            # Full documentation
```

## ✅ Verification Checklist

- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:3000`
- [ ] Can access `/cxr-ai` page
- [ ] Can upload an image
- [ ] Analysis completes successfully

## 🔧 Troubleshooting

**Backend won't start:**
- Check Python version (3.11+)
- Verify all dependencies installed
- Check port 8000 is available

**Frontend can't connect:**
- Verify `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Check backend is running
- Check CORS settings in backend `.env`

**Model loading fails:**
- Check internet connection
- Verify Hugging Face token if needed
- Check disk space (model is ~6GB)

## 📝 Environment Variables

### Backend (.env)
```env
HF_MODEL_NAME=nvidia/NV-Reason-CXR-3B
HF_TOKEN=optional_token_if_needed
DEVICE=cuda
MAX_NEW_TOKENS=1024
PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 🎯 Next Steps

1. Test with a sample chest X-ray image
2. Customize prompts for different analysis types
3. Review the full documentation in `INTEGRATION_README.md`
4. Deploy to production (see Docker instructions)

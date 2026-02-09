"""
FastAPI backend service for NV-Reason-CXR model inference.
"""
import os
import time
import logging
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from model_runner import ModelRunner, InferenceResult

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="NV-Reason-CXR API",
    description="Chest X-ray reasoning API using NVIDIA NV-Reason-CXR-3B model",
    version="1.0.0"
)

# CORS configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model runner instance
model_runner: Optional[ModelRunner] = None


class AnalyzeResponse(BaseModel):
    ok: bool
    model: str
    output_text: str
    runtime: dict
    disclaimer: str


@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    global model_runner
    try:
        logger.info("Loading NV-Reason-CXR model...")
        model_runner = ModelRunner()
        logger.info("Model loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load model: {e}", exc_info=True)
        raise


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "NV-Reason-CXR API",
        "model_loaded": model_runner is not None
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": model_runner is not None
    }


@app.options("/api/cxr/analyze")
async def options_cxr_analyze():
    """Handle CORS preflight requests."""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.post("/api/cxr/analyze", response_model=AnalyzeResponse)
async def analyze_cxr(
    image: UploadFile = File(..., description="Chest X-ray image (PNG/JPG)"),
    prompt: str = Form(default="Find abnormalities and support devices.", description="Analysis prompt")
):
    """
    Analyze a chest X-ray image using NV-Reason-CXR model.
    
    Args:
        image: Uploaded chest X-ray image file
        prompt: Text prompt for analysis (default: "Find abnormalities and support devices.")
    
    Returns:
        JSON response with analysis results
    """
    if model_runner is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please check server logs."
        )
    
    # Validate file type
    allowed_types = ["image/png", "image/jpeg", "image/jpg"]
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size (10MB limit)
    MAX_SIZE = 10 * 1024 * 1024  # 10MB
    contents = await image.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_SIZE / (1024*1024):.1f}MB"
        )
    
    try:
        # Run inference
        start_time = time.time()
        result: InferenceResult = await model_runner.run_inference(
            image_data=contents,
            prompt=prompt
        )
        elapsed_time = time.time() - start_time
        
        return AnalyzeResponse(
            ok=True,
            model=os.getenv("HF_MODEL_NAME", "nvidia/NV-Reason-CXR-3B"),
            output_text=result.output_text,
            runtime={
                "device": result.device,
                "seconds": round(elapsed_time, 2)
            },
            disclaimer="For research/education only. Not a medical diagnosis."
        )
    
    except Exception as e:
        logger.error(f"Inference error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Inference failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

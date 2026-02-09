"""
Model runner for NV-Reason-CXR inference.
"""
import os
import io
import logging
import asyncio
from typing import Optional
from dataclasses import dataclass

import torch
from PIL import Image
from transformers import AutoModelForImageTextToText, AutoProcessor

logger = logging.getLogger(__name__)


@dataclass
class InferenceResult:
    """Result from model inference."""
    output_text: str
    device: str


class ModelRunner:
    """Handles model loading and inference."""
    
    def __init__(self):
        """Initialize and load the model."""
        self.model: Optional[AutoModelForImageTextToText] = None
        self.processor: Optional[AutoProcessor] = None
        self.device: str = self._get_device()
        
        # Load model
        self._load_model()
    
    def _get_device(self) -> str:
        """Determine the device to use (CUDA or CPU)."""
        if torch.cuda.is_available():
            device = "cuda"
            logger.info(f"Using CUDA device: {torch.cuda.get_device_name(0)}")
        else:
            device = "cpu"
            logger.warning("CUDA not available. Using CPU (inference will be slower).")
        return device
    
    def _load_model(self):
        """Load the model and processor."""
        model_name = os.getenv("HF_MODEL_NAME", "nvidia/NV-Reason-CXR-3B")
        hf_token = os.getenv("HF_TOKEN", None)
        
        logger.info(f"Loading model: {model_name}")
        
        try:
            # Load processor
            self.processor = AutoProcessor.from_pretrained(
                model_name,
                token=hf_token
            )
            logger.info("Processor loaded successfully")
            
            # Load model
            torch_dtype = torch.float16 if self.device == "cuda" else torch.float32
            self.model = AutoModelForImageTextToText.from_pretrained(
                model_name,
                torch_dtype=torch_dtype,
                token=hf_token
            ).eval().to(self.device)
            
            logger.info(f"Model loaded successfully on {self.device}")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}", exc_info=True)
            raise
    
    async def run_inference(
        self,
        image_data: bytes,
        prompt: str = "Find abnormalities and support devices."
    ) -> InferenceResult:
        """
        Run inference on an image.
        
        Args:
            image_data: Image file bytes
            prompt: Text prompt for analysis
        
        Returns:
            InferenceResult with output text and device info
        """
        if self.model is None or self.processor is None:
            raise RuntimeError("Model not loaded")
        
        # Run inference in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            self._run_inference_sync,
            image_data,
            prompt
        )
        return result
    
    def _run_inference_sync(
        self,
        image_data: bytes,
        prompt: str
    ) -> InferenceResult:
        """Synchronous inference (runs in thread pool)."""
        try:
            # Load image from bytes
            image = Image.open(io.BytesIO(image_data))
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            # Prepare messages
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "image": image,
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
            
            # Create prompt using chat template
            text = self.processor.apply_chat_template(
                messages,
                add_generation_prompt=True
            )
            
            # Process inputs
            inputs = self.processor(
                text=text,
                images=[image],
                return_tensors="pt"
            )
            inputs = inputs.to(self.device)
            
            # Generate
            max_new_tokens = int(os.getenv("MAX_NEW_TOKENS", "1024"))
            with torch.no_grad():
                generated_ids = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens
                )
            
            # Trim and decode
            trimmed_generated_ids = [
                out_ids[len(in_ids):]
                for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            generated_text = self.processor.batch_decode(
                trimmed_generated_ids,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=False
            )[0]
            
            return InferenceResult(
                output_text=generated_text,
                device=self.device
            )
        
        except Exception as e:
            logger.error(f"Inference error: {e}", exc_info=True)
            raise

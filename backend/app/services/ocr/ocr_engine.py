import os
import cv2
import numpy as np
import httpx
from typing import NamedTuple, Tuple
from pdf2image import convert_from_path
import tempfile
from app.core.config import settings

class OcrResult(NamedTuple):
    text: str
    confidence: float
    language_detected: str
    engine_used: str

def preprocess_image(image_path: str) -> np.ndarray:
    """Preprocess image for better OCR results."""
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("Could not read image")
    
    # Deskew
    coords = np.column_stack(np.where(img > 0))
    if len(coords) > 0:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        (h, w) = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        img = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    # Denoise & Threshold
    img = cv2.fastNlMeansDenoising(img, None, h=10, searchWindowSize=21, templateWindowSize=7)
    img = cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    
    # Morphological ops
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
    img = cv2.morphologyEx(img, cv2.MORPH_OPEN, kernel)
    
    return img

async def run_ocr(file_path: str, mime_type: str) -> OcrResult:
    # If PDF, convert first page to image
    img_path = file_path
    temp_img = None
    if mime_type == "application/pdf":
        images = convert_from_path(file_path, first_page=1, last_page=1)
        if not images:
            raise ValueError("Could not extract image from PDF")
        
        _, temp_img = tempfile.mkstemp(suffix=".jpg")
        images[0].save(temp_img, "JPEG")
        img_path = temp_img

    # Sarvam AI path
    if settings.SARVAM_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                with open(img_path, "rb") as f:
                    response = await client.post(
                        "https://api.sarvam.ai/v1/document/ocr", # Note: fictional endpoint based on prompt
                        headers={"Authorization": f"Bearer {settings.SARVAM_API_KEY}"},
                        files={"file": f}
                    )
                    if response.status_code == 200:
                        data = response.json()
                        text = data.get("text", "")
                        return OcrResult(text=text, confidence=0.92, language_detected="mixed", engine_used="sarvam")
        except Exception:
            pass # fallback to PaddleOCR

    # Fallback to PaddleOCR
    try:
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(use_angle_cls=True, lang='devanagari') # supports hindi + english
        
        preprocessed = preprocess_image(img_path)
        # PaddleOCR can take numpy array
        result = ocr.ocr(preprocessed, cls=True)
        
        texts = []
        confidences = []
        if result and result[0]:
            for line in result[0]:
                if line and len(line) == 2:
                    texts.append(line[1][0])
                    confidences.append(line[1][1])
        
        combined_text = "\n".join(texts)
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
        
        res = OcrResult(text=combined_text, confidence=avg_conf, language_detected="devanagari", engine_used="paddleocr")
    finally:
        if temp_img and os.path.exists(temp_img):
            os.remove(temp_img)
            
    return res

import cv2
import numpy as np

def classify_document(text: str, image_path: str) -> tuple[bool, str]:
    """
    Stage 1 classifier. Uses keyword heuristics to decide if a document is a land record.
    Returns (is_land_record, rejection_reason)
    """
    keywords = [
        'khasra', 'khata', 'survey', 'tehsil', 'mutation', 'खसरा', 'खाता', 
        'खतौनी', 'मुतेशन', 'जमाबंदी', 'पट्टा', 'रजिस्ट्री', 'सर्वे', 'plot area', 
        'village', 'district', 'land record', 'bhoomi', 'भूमि'
    ]
    
    text_lower = text.lower()
    found_keywords = sum(1 for kw in keywords if kw.lower() in text_lower)
    
    if found_keywords >= 2:
        return True, ""
    
    # Try basic image heuristics if text is weak
    try:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is not None:
            # Check if there are table-like lines using HoughLines
            edges = cv2.Canny(img, 50, 150, apertureSize=3)
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=100, maxLineGap=10)
            if lines is not None and len(lines) > 5:
                # Table structure suggests it might be a land record despite OCR issues
                return True, ""
    except Exception as e:
        pass # Ignore image errors and fail below

    return False, f"Document rejected: Found only {found_keywords} land record keywords. Missing expected tabular structure."

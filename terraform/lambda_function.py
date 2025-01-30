import json
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from dataclasses import dataclass
from typing import List, Tuple, Optional
import logging
import traceback
from dataclasses import asdict


@dataclass
class Symbol:
    id: str
    confidence: float
    top_left: Tuple[float, float]
    bottom_right: Tuple[float, float]
    bbox: Tuple[float, float, float, float]  # x, y, width, height
    color: Tuple[int,int,int]

class SymbolDetectionService:
    def __init__(self, template_matching_threshold=0.7):  # Adjusted default threshold
        self.threshold = template_matching_threshold
        self.logger = logging.getLogger(__name__)
        self.used_colors = []

        
    def bytes_to_img(self, image_bytes: bytes):
        nparr = np.frombuffer(image_bytes, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

    def preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        """Preprocess image by inverting and binarizing."""
        try:
            img = self.bytes_to_img(image_bytes)
            
            if len(img.shape) == 3:
                img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Invert image to make symbols white on black background
            img = cv2.bitwise_not(img)
            # Apply global threshold to ensure binary image
            _, img = cv2.threshold(img, 1, 255, cv2.THRESH_BINARY)
            
            return img
        except Exception as e:
            self.logger.error(f"Error preprocessing image: {str(e)}")
            raise

    def detect_symbols(self, symbols: List[bytes], target_bytes: bytes) -> List[Symbol]:
        """Detect symbols using corrected threshold comparison."""
        try:
            target_processed = self.preprocess_image(target_bytes)
            detected_symbols = []
            
            for symbol_idx, symbol in enumerate(symbols):
                symbol_processed = self.preprocess_image(symbol['image'])
                
                result = cv2.matchTemplate(target_processed, symbol_processed, cv2.TM_CCOEFF_NORMED)
                
                h, w = symbol_processed.shape
                locations = np.where(result >= self.threshold)

                label = symbol.get('label', 'symbol'+str(symbol_idx))                
                for pt_idx, pt in enumerate(zip(*locations[::-1])):
                    confidence = result[pt[1], pt[0]]
                    detected_symbols.append(
                        Symbol(
                            id=f"{label}-{pt_idx}",
                            confidence=float(confidence),
                            top_left=(int(pt[0]), int(pt[1])),
                            bottom_right=(int(pt[0] + w), int(pt[1] + h)),
                            color=symbol['color'],
                            bbox=(int(pt[0]), int(pt[1]), int(w), int(h)),
                        )
                    )

            return self.refine_detection(detected_symbols)
        except Exception as e:
            self.logger.error(f"Error in symbol detection: {str(e)}")
            raise

    def refine_detection(self, symbols: List[Symbol]) -> List[Symbol]:
        """Non-maximum suppression to remove overlapping detections."""
        def calculate_iou(box1, box2):
            x1, y1, w1, h1 = box1
            x2, y2, w2, h2 = box2
            
            x_left = max(x1, x2)
            y_top = max(y1, y2)
            x_right = min(x1 + w1, x2 + w2)
            y_bottom = min(y1 + h1, y2 + h2)
            
            if x_right < x_left or y_bottom < y_top:
                return 0.0
                
            intersection = (x_right - x_left) * (y_bottom - y_top)
            box1_area = w1 * h1
            box2_area = w2 * h2
            union = box1_area + box2_area - intersection
            
            return intersection / union

        refined_symbols = []
        symbols.sort(key=lambda x: x.confidence, reverse=True)
        
        while symbols:
            current = symbols.pop(0)
            refined_symbols.append(current)
            symbols = [
                symbol for symbol in symbols
                if calculate_iou(current.bbox, symbol.bbox) < 0.5
            ]
        
        return refined_symbols

    def mark_matches(self, blueprint_bytes: bytes, symbols: List[Symbol]):
        blueprint_img = self.bytes_to_img(blueprint_bytes)
        marked_img = blueprint_img.copy()
        for symbol in symbols:
            cv2.rectangle(marked_img, symbol.top_left, symbol.bottom_right, hex_to_bgr(symbol.color), 2)
        return marked_img

    def encode_image(self, image: np.ndarray):
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(image_rgb)
        buffer = BytesIO()
        img_pil.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode()


def hex_to_bgr(hex_color: str) -> tuple:
    """Convert hex color code to RGB tuple"""
    if hex_color is None: 
        return None

    hex_color = hex_color.lstrip('#')
    
    # Handle shorthand (3-digit) format
    if len(hex_color) == 3:
        hex_color = ''.join([c*2 for c in hex_color])
    
    # Convert to RGB
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    
    return (b, g, r)

headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
}
def lambda_handler(event, context):
    try:
        # Parse input from API Gateway
        body = json.loads(event['body'])
        print("BODY::",body.keys())
        blueprint_bytes = body.get('blueprint', None)
        symbols = body.get('symbols',None)
        threshold = body.get('threshold',0.8)
        print("THRESHOLD::", threshold, type(threshold))

        print("symbols::",symbols)
        if not blueprint_bytes or not symbols:
            raise ValueError("Blueprint and symbol images are required.")

        if "base64," in blueprint_bytes:
            blueprint_bytes = blueprint_bytes.split('base64,')[1]
        blueprint_bytes = base64.b64decode(blueprint_bytes)

        new_symbols = []
        for symbol in symbols:
            symbol_img = symbol.get('image',None)
            if "base64," in symbol_img:
                symbol_img = symbol_img.split('base64,')[1]
            
            symbol['image'] = base64.b64decode(symbol_img)
            new_symbols.append(symbol)

        symbols = new_symbols
        print("SYMBOLS::", symbols)
        service = SymbolDetectionService(threshold)
        # Detect symbols
        detected_symbols = service.detect_symbols( symbols,  blueprint_bytes )
        print("Detected symbols ::", detected_symbols)

        marked_image = service.mark_matches(blueprint_bytes, detected_symbols)
        marked_image = service.encode_image(marked_image)

      
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'marked_image': marked_image,
                'symbol_count': len(detected_symbols),
                'detected_symbols':[asdict(symbol) for symbol in detected_symbols]
            })
        }
        
    except Exception as e:
        print(traceback.format_exc())

        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': str(e) 
            })
        }
    
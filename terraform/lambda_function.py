import json
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from dataclasses import dataclass
from typing import List, Tuple, Optional
import logging


@dataclass
class Symbol:
    id: str
    type: str
    confidence: float
    top_left: Tuple[float, float]
    bottom_right: Tuple[float, float]
    bbox: Tuple[float, float, float, float]  # x, y, width, height
    page_number: int
    template_image: Optional[np.ndarray] = None

class SymbolDetectionService:
    def __init__(self, template_matching_threshold=0.8):
        self.threshold = template_matching_threshold
        self.logger = logging.getLogger(__name__)
  
    def bytes_to_img(self, image_bytes: bytes) -> cv2.typing.MatLike:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

    def preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        """Preprocess image for better symbol detection."""
        try:

            # Convert bytes to numpy array
            img = self.bytes_to_img(image_bytes)
            
            # Apply adaptive threshold to handle different lighting conditions (assuming binary image not provided)
            if len(img.shape) == 3:  # Check if image has 3 channels (color)
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)  # Convert to grayscale if colored
            else:
                gray = img  # Already grayscale

            binary = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY_INV, 11, 2
            )
            kernel = np.ones((2,2), np.uint8)
            binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
            return binary
        except Exception as e:
            self.logger.error(f"Error preprocessing image: {str(e)}")
            raise

    def detect_symbols(self, templates_bytes: List[bytes], target_bytes: bytes) -> List[Symbol]:
        """Detect symbols from templates in target image."""
        try:
            target_processed = self.preprocess_image(target_bytes)
            detected_symbols = []
            
            for template_idx, template_bytes in enumerate(templates_bytes):
                template_processed = self.preprocess_image(template_bytes)
                
                result = cv2.matchTemplate(target_processed, template_processed, cv2.TM_CCOEFF_NORMED)
                
                h, w = template_processed.shape
                locations = np.where(result >= self.threshold)
                for pt in zip(*locations[::-1]):
                    symbol = Symbol(
                        id=f"symbol_{len(detected_symbols)}",
                        type=f"template_{template_idx}",
                        confidence=float(result[pt[1], pt[0]]),
                        top_left = (pt[0], pt[1]),
                        bottom_right =  (pt[0]+ w, pt[1]+h),
                        bbox=(
                            float(pt[0]),
                            float(pt[1]),
                            float(template_processed.shape[1]),
                            float(template_processed.shape[0])
                        ),
                        page_number=1,
                        template_image=template_bytes
                    )
                    detected_symbols.append(symbol)
            
            return self.refine_detection(detected_symbols)
        except Exception as e:
            self.logger.error(f"Error in symbol detection: {str(e)}")
            raise

    def refine_detection(self, symbols: List[Symbol]) -> List[Symbol]:
        """Remove overlapping detections."""
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

    # Function to mark matched locations on the blueprint
    def mark_matches(self, blueprint_bytes:bytes, symbols:List[Symbol], color=(0, 0, 255)):

        blueprint_img = self.bytes_to_img(blueprint_bytes)
        marked_img = blueprint_img.copy()
        print("marked_img shape1: ",marked_img.shape)
        for symbol in symbols:
            print(symbol.top_left, symbol.bottom_right)
            cv2.rectangle(marked_img, symbol.top_left,symbol.bottom_right, color, 2)
        print("marked_img shape2: ",marked_img.shape)
        return marked_img

    def encode_image(self,image:np.ndarray):
        # Convert numpy array to PIL Image
        img_pil = Image.fromarray(image)
        # Save to BytesIO buffer
        buffer = BytesIO()
        img_pil.save(buffer, format='PNG')
        # Encode to base64
        return base64.b64encode(buffer.getvalue()).decode()


headers= {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
    }
def lambda_handler(event, context):
    try:
        # Parse input from API Gateway
        body = json.loads(event['body'])
        blueprint_bytes = base64.b64decode(body['blueprint_image'])
        symbol_bytes = base64.b64decode(body['symbol_image'])
        if symbol_bytes and  type(symbol_bytes[0]) != list:
            symbol_bytes = [symbol_bytes]

        service = SymbolDetectionService()
        # Detect symbols
        detected_symbols = service.detect_symbols( symbol_bytes,  blueprint_bytes )
        print("Detected symbols ::", detected_symbols)

        marked_image = service.mark_matches(blueprint_bytes, detected_symbols)
        marked_image = service.encode_image(marked_image)

      
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'marked_image': marked_image,
                'symbol_count': len(detected_symbols),
                # 'symbols': detected_symbols
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': str(e) 
            })
        }
    

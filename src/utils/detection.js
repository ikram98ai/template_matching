import cv from "@techstark/opencv-js"
// Symbol class definition using TypeScript-like structure
class Symbol {
    constructor(id, confidence, topLeft, bottomRight, bbox, color, symbolImage = null) {
        this.id = id;
        this.confidence = confidence;
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;
        this.bbox = bbox;
        this.color = color;
        this.symbolImage = symbolImage;
    }
}

class SymbolDetectionService {
    constructor(templateMatchingThreshold = 0.8) {
        this.threshold = templateMatchingThreshold;
    }

    generateColor(index) {
        const colorPalette = [
            [255, 0, 0],    // Red
            [0, 255, 0],    // Green
            [0, 0, 255],    // Blue
            [255, 255, 0],  // Yellow
            [255, 0, 255],  // Magenta
            [0, 255, 255],  // Cyan
        ];
        return colorPalette[index % colorPalette.length];
    }

    async base64ToImg(base64String) {
        return new Promise((resolve, reject) => {
            try {
                const image = new Image();
                image.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = image.width;
                    canvas.height = image.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(image, 0, 0);
                    const mat = cv.imread(canvas);
                    resolve(mat);
                };
                image.onerror = () => {
                    reject(new Error('Failed to load image'));
                };
                image.src = base64String.startsWith('data:') ? 
                    base64String : `data:image/png;base64,${base64String}`;
            } catch (error) {
                reject(error);
            }
        });
    }

    preprocessImage(img) {
        let gray = new cv.Mat();
        let binary = new cv.Mat();
        let processed = new cv.Mat();
        let kernel = new cv.Mat();
        
        try {
            // Convert to grayscale if image is colored
            if (img.channels() === 3) {
                cv.cvtColor(img, gray, cv.COLOR_BGR2GRAY);
            } else if (img.channels() === 4) {
                cv.cvtColor(img, gray, cv.COLOR_BGRA2GRAY);
            } else {
                img.copyTo(gray);
            }

            // Create kernel for morphological operations
            kernel = cv.Mat.ones(2, 2, cv.CV_8U);

            // Apply adaptive threshold
            cv.adaptiveThreshold(
                gray,
                binary,
                255,
                cv.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv.THRESH_BINARY_INV,
                11,
                2
            );

            // Apply morphological operation
            cv.morphologyEx(binary, processed, cv.MORPH_OPEN, kernel);

            return processed;
        } catch (error) {
            console.error("Error in preprocessImage:", error);
            throw error;
        } finally {
            // Clean up intermediate matrices
            gray.delete();
            binary.delete();
            kernel.delete();
        }
    }

    calculateIou(box1, box2) {
        const [x1, y1, w1, h1] = box1;
        const [x2, y2, w2, h2] = box2;

        const xLeft = Math.max(x1, x2);
        const yTop = Math.max(y1, y2);
        const xRight = Math.min(x1 + w1, x2 + w2);
        const yBottom = Math.min(y1 + h1, y2 + h2);

        if (xRight < xLeft || yBottom < yTop) {
            return 0.0;
        }

        const intersection = (xRight - xLeft) * (yBottom - yTop);
        const box1Area = w1 * h1;
        const box2Area = w2 * h2;
        const union = box1Area + box2Area - intersection;

        return intersection / union;
    }

    refineDetection(symbols) {
        symbols.sort((a, b) => b.confidence - a.confidence);
        const refinedSymbols = [];

        while (symbols.length > 0) {
            const current = symbols.shift();
            refinedSymbols.push(current);
            symbols = symbols.filter(symbol => 
                this.calculateIou(current.bbox, symbol.bbox) < 0.5
            );
        }

        return refinedSymbols;
    }

    async detectSymbols(symbolsBase64List, targetBase64) {
        let targetImg = null;
        let targetProcessed = null;
        const detectedSymbols = [];

        try {
            // Load target image
            targetImg = await this.base64ToImg(targetBase64);
            targetProcessed = this.preprocessImage(targetImg);

            // Process each symbol template
            for (let symbolIdx = 0; symbolIdx < symbolsBase64List.length; symbolIdx++) {
                let symbolImg = null;
                let symbolProcessed = null;
                let result = null;
                
                try {
                    symbolImg = await this.base64ToImg(symbolsBase64List[symbolIdx]);
                    symbolProcessed = this.preprocessImage(symbolImg);

                    // Prepare matrices for template matching
                    result = new cv.Mat();

                    // Perform template matching
                    cv.matchTemplate(
                        targetProcessed,
                        symbolProcessed,
                        result,
                        cv.TM_CCORR_NORMED
                    );

                    // Get symbol dimensions
                    const symbolHeight = symbolProcessed.rows;
                    const symbolWidth = symbolProcessed.cols;

                    // Find matches above threshold
                    for (let row = 0; row < result.rows; row++) {
                        for (let col = 0; col < result.cols; col++) {
                            const confidence = result.floatAt(row, col);
                            if (confidence >= this.threshold) {
                                const symbol = new Symbol(
                                    `symbol_${symbolIdx}`,
                                    confidence,
                                    [col, row],
                                    [col + symbolWidth, row + symbolHeight],
                                    [col, row, symbolWidth, symbolHeight],
                                    this.generateColor(symbolIdx),
                                    symbolsBase64List[symbolIdx]
                                );
                                detectedSymbols.push(symbol);
                            }
                        }
                    }
                } finally {
                    // Clean up resources for this iteration
                    if (symbolImg) symbolImg.delete();
                    if (symbolProcessed) symbolProcessed.delete();
                    if (result) result.delete();
                }
            }

            return this.refineDetection(detectedSymbols);
        } catch (error) {
            console.error("Error in detectSymbols:", error);
            throw error;
        } finally {
            // Clean up main resources
            if (targetImg) targetImg.delete();
            if (targetProcessed) targetProcessed.delete();
        }
    }


    async markMatches(blueprintBase64, symbols) {
        let blueprintImg = null;
        let markedImg = null;
        let rgbaImg = null;

        try {
            blueprintImg = await this.base64ToImg(blueprintBase64);
            
            // Convert to RGBA to ensure proper color display
            rgbaImg = new cv.Mat();
            if (blueprintImg.channels() === 1) {
                cv.cvtColor(blueprintImg, rgbaImg, cv.COLOR_GRAY2RGBA);
            } else if (blueprintImg.channels() === 3) {
                cv.cvtColor(blueprintImg, rgbaImg, cv.COLOR_BGR2RGBA);
            } else {
                blueprintImg.copyTo(rgbaImg);
            }
            
            markedImg = rgbaImg.clone();

            // Draw rectangles
            symbols.forEach(symbol => {
                // Create proper color scalar with alpha channel
                const color = new cv.Scalar(...symbol.color, 255); // Add alpha channel
                
                // Create points for rectangle
                const pt1 = new cv.Point(
                    Math.round(symbol.topLeft[0]), 
                    Math.round(symbol.topLeft[1])
                );
                const pt2 = new cv.Point(
                    Math.round(symbol.bottomRight[0]), 
                    Math.round(symbol.bottomRight[1])
                );
                
                // Draw rectangle with thickness 2
                cv.rectangle(markedImg, pt1, pt2, color, 2, cv.LINE_8);
            });

            // Convert to canvas and then to base64
            const canvas = document.createElement('canvas');
            canvas.width = markedImg.cols;
            canvas.height = markedImg.rows;
            cv.imshow(canvas, markedImg);
            
            return canvas.toDataURL('image/png').split(',')[1];

        } catch (error) {
            console.error("Error in markMatches:", error);
            throw error;
        } finally {
            // Clean up resources
            if (blueprintImg) blueprintImg.delete();
            if (markedImg) markedImg.delete();
            if (rgbaImg) rgbaImg.delete();
        }
    }
}

// Example usage:
export default async function detectSymbolsInBlueprint(blueprintBase64, symbolsBase64List) {
    const detector = new SymbolDetectionService();
    try {
        // Detect symbols
        const detectedSymbols = await detector.detectSymbols(symbolsBase64List, blueprintBase64);
        
        // Mark matches on blueprint
        const markedImageBase64 = await detector.markMatches(blueprintBase64, detectedSymbols);
        
        return {
            symbol_count: detectedSymbols.length,
            marked_image: markedImageBase64,
            detected_symbols: detectedSymbols // Optional: if you want to return the detected symbols
        };
      
    } catch (error) {
        console.error("Error in symbol detection process:", error);
        throw error;
    }
}
  
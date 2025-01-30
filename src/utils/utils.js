import * as pdfjsLib from 'pdfjs-dist';
import cv from "@techstark/opencv-js"

pdfjsLib.GlobalWorkerOptions.workerSrc =  `${import.meta.env.BASE_URL}/pdf.worker.min.mjs`;

export const pdfToImage = async (pdfFile) => {
    try {
        const fileReader = new FileReader();
        const pdfBytes = await new Promise((resolve, reject) => {
            fileReader.onloadend = () => resolve(new Uint8Array(fileReader.result));
            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(pdfFile);
        });

        const pdf = await pdfjsLib.getDocument(pdfBytes).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('Error converting PDF to image:', error);
        return null;
    }
};

export const  readImageAsBase64 = async (file) => {
    if (file)
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file); // Converts the file to a base64 string
        });
    else null
}


// Update your hexToRgba function to return RGBA format
export const hexToRgba = (hex) => {
    const cleanedHex = hex.replace(/^#/, '');
    const expand = cleanedHex.length === 3;
    
    return new cv.Scalar(
        parseInt(expand ? cleanedHex.slice(0,1).repeat(2) : cleanedHex.slice(0,2), 16), // R
        parseInt(expand ? cleanedHex.slice(1,2).repeat(2) : cleanedHex.slice(2,4), 16), // G
        parseInt(expand ? cleanedHex.slice(2,3).repeat(2) : cleanedHex.slice(4,6), 16), // B
        255 // Alpha channel (fully opaque)
    )
  };



  export const matToBase64 = (mat) => {
    // Convert BGR to RGB format
    const rgb = new cv.Mat();
    cv.cvtColor(mat, rgb, cv.COLOR_BGR2RGB);
  
    // Create canvas and context
    const canvas = document.createElement('canvas');
    canvas.width = rgb.cols;
    canvas.height = rgb.rows;
    const ctx = canvas.getContext('2d');
  
    // Create ImageData object
    const imageData = ctx.createImageData(rgb.cols, rgb.rows);
    const data = new Uint8ClampedArray(rgb.data);
    
    // Convert to RGBA (add alpha channel)
    const rgbaData = new Uint8ClampedArray(rgb.cols * rgb.rows * 4);
    for (let i = 0; i < data.length; i += 3) {
      rgbaData[i * 4/3] = data[i];         // R
      rgbaData[i * 4/3 + 1] = data[i + 1]; // G
      rgbaData[i * 4/3 + 2] = data[i + 2]; // B
      rgbaData[i * 4/3 + 3] = 255;         // A (fully opaque)
    }
  
    // Put image data to canvas
    imageData.data.set(rgbaData);
    ctx.putImageData(imageData, 0, 0);
  
    // Convert to base64
    const base64 = canvas.toDataURL('image/png');
  
    // Cleanup OpenCV mats
    rgb.delete();
    
    return base64;
  };
  
  const  base64ToImg = (base64String) =>{
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
  
export const getSymbolBase64 = async (targetImg,bbox) => {
    const [col, row, symbolWidth, symbolHeight] = bbox;
    const roiRect = new cv.Rect(col, row, symbolWidth, symbolHeight);
    targetImg = await base64ToImg(targetImg);
    const symbolRegion = targetImg.roi(roiRect).clone();
    const symbolBase64 = matToBase64(symbolRegion);
    symbolRegion.delete(); // Important! Cleanup memory
    return symbolBase64
}
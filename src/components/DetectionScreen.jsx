import React, { useState, useEffect } from "react";
import { pdfToImage } from "../utils/pdfUtils"; // Function to convert PDF to image
import ImageCropper from "./ImageCropper"
import ZoomableImage from "./ZoomableImage";
function DetectionScreen({ pdfs }) {
  const [images, setImages] = useState({ index: null, blueprint: null });
  const [croppedSymbol, setCroppedSymbol] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const convertPdfsToImages = async () => {
      setIsLoading(true); // Start loading
      try {
        const indexImage = await pdfToImage(pdfs.index);
        const blueprintImage = await pdfToImage(pdfs.blueprint);
        setImages({ index: indexImage, blueprint: blueprintImage });
      } catch (error) {
        console.error("Error converting PDFs to images:", error);
      } finally {
        setIsLoading(false); // Stop loading
      }
    };
    if (pdfs.index != null && pdfs.blueprint != null) {
      convertPdfsToImages();
    }
  }, [pdfs]);

 
  const handleDetect = async () => {
    if (!croppedSymbol) {
      alert("Please crop or draw a symbol.");
      return;
    }

    try {
      const response = await fetch("YOUR_LAMBDA_INVOKE_URL", {
        // Replace with your Lambda Invoke URL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          croppedSymbol: croppedSymbol,
          blueprint: images.blueprint,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to detect symbols");
      }

      const data = await response.json();
      setDetectionResult(data);
    } catch (error) {
      console.error("Error calling Lambda:", error);
      alert(error.message);
    }
  };


  return (
  <>
    {isLoading ? <p className="text-center mt-20" >Converting PDFs to images...</p>:
    <div>
      <div>
        <label>Cropped Symbol</label>
        {croppedSymbol && <img src={croppedSymbol} alt="Cropped Symbol" className="w-32 h-32 border-2 rounded-lg object-contain" />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
        <div>
          <label htmlFor="">Crop symbol from below (zoomable)</label>
          <ImageCropper className="border-2" image={images.index} setCroppedSymbol={setCroppedSymbol} />
        </div>
        <div>
          <label htmlFor="">Blueprint (zoomable)</label>
          {images.blueprint && (
              <ZoomableImage imageSrc={images.blueprint} />
          )}
        </div>
      </div>
      {croppedSymbol && <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600" onClick={handleDetect}>Detect</button>}

      {detectionResult && (
        <div>
          <img src={detectionResult.blueprint} alt="Detected Blueprint" />
          <p>Detected Symbols: {detectionResult.count}</p>
          {/* Display coordinates or other feedback here */}
        </div>
      )}
    </div>}
  </>
  );
}

export default DetectionScreen;

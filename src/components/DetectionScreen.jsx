import React, { useState, useEffect } from "react";
import { pdfToImage,readImageAsBase64 } from "../utils/utils"; // Function to convert PDF to image
import ImageCropper from "./ImageCropper"
import ZoomableImage from "./ZoomableImage";
import Spinner from "./Spinner";
import FeedbackPanel from "./FeedbackPanel";
import CropSymbols from "./CropSymbols";
import axios from "axios";
import detectSymbolsInBlueprint from "../utils/detection";

function DetectionScreen({ files }) {
  const [images, setImages] = useState({ index: null, blueprint: null });
  const [croppedSymbol, setCroppedSymbol] = useState(null);
  const [croppedSymbols, setCroppedSymbols] = useState([]);

  // const [croppedBlueprint, setCroppedBlueprint] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const convertPdfsToImages = async () => {
      setIsLoading(true); // Start loading
      try {
        let indexImage = null
        let blueprintImage = null

        if (files.index?.type == "application/pdf")
          indexImage = await pdfToImage(files.index);
        else  
          indexImage = await readImageAsBase64(files.index)
        
        
        if (files.blueprint?.type == "application/pdf")
          blueprintImage = await pdfToImage(files.blueprint);
        else  
        blueprintImage = await readImageAsBase64(files.blueprint)
      
      if (blueprintImage == null) 
        blueprintImage = indexImage
                  
        setImages({ index: indexImage, blueprint: blueprintImage });
      } catch (error) {
        console.error("Error converting PDFs to images:", error);
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    if (files.index != null ) {
      convertPdfsToImages();
    }
  }, [files]);

 
  const handleDetect = async () => {
    if (!croppedSymbol) {
      alert("Please crop or draw a symbol.");
      return;
    }
    setIsLoading(true); // Start loading

    try {

      const payload = {
        blueprint_image: images.blueprint,
        symbol_image: croppedSymbols,
      };
  
      // const response = await axios.post(
      //   "https://syeyumufgh.execute-api.us-east-1.amazonaws.com/prod/detect", 
      //   payload,
      //   {
      //     headers: { 
      //       "Content-Type": "application/json"
      //     }
      //   }
      // );
      const result = await detectSymbolsInBlueprint(payload.blueprint_image,payload.symbol_image)
      setDetectionResult(result);

    } catch (error) {
      console.error("Error calling Lambda:", error);
      alert(error.message);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const addCroppedSymbol = ()=>{
    setCroppedSymbols((prevCroppedSymbols)=> [croppedSymbol, ...prevCroppedSymbols])
  }

  const removeCroppedSymbol = (index)=>{
    setCroppedSymbols((prevCroppedSymbols)=> prevCroppedSymbols.filter((_,i)=> i !== index))
  }
  return (
  <>
    {isLoading && <Spinner />}
    <div className="flex flex-row gap-4">
      <div>
      <FeedbackPanel>
        <CropSymbols croppedSymbols={croppedSymbols} addCroppedSymbol={addCroppedSymbol} removeCroppedSymbol={removeCroppedSymbol} />
      </FeedbackPanel>
      </div>
        
      <div>
      <div className={"grid grid-cols-1 gap-4 py-2" + files.blueprint? "sm:grid-cols-2": " sm:grid-cols-1"}>
        <div>
          <label>Crop symbol from below Image (zoomable)</label>
          <ImageCropper className="border-2" image={images.index} setCroppedImage={setCroppedSymbol} />
        </div>

        {files.blueprint && (
          <div>
                <label>Blueprint (zoomable)</label>
                <ZoomableImage imageSrc={images.blueprint} />
                {/* // <ImageCropper className="border-2" image={images.blueprint} setCroppedSymbol={setCroppedBlueprint} /> */}

          </div>
        )}
      </div>

      <hr className="py-2 mt-2"/>
     
      {croppedSymbol && <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600" onClick={handleDetect}>Detect</button>}
      
      <hr className="py-2 mt-2"/>
      {detectionResult && (
        <div>
          <p>Detected Symbols: {detectionResult.symbol_count}</p>
          <ZoomableImage imageSrc={"data:image/png;base64,"+detectionResult.marked_image}  />
          {/* Display coordinates or other feedback here */}
        </div>
      )}
      </div>
      </div>
  </>
  );
}

export default DetectionScreen;

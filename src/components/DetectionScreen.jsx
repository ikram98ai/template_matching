import React, { useState, useEffect } from "react";
import { pdfToImage } from "../utils/pdfUtils"; // Function to convert PDF to image
import ImageCropper from "./ImageCropper"
import ZoomableImage from "./ZoomableImage";
import axios from "axios";
import Spinner from "./Spinner";
import { FaTrash } from "react-icons/fa"; // FontAwesome trash icon

function DetectionScreen({ pdfs }) {
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
    setIsLoading(true); // Start loading

    try {

      const payload = {
        blueprint_image: images.blueprint,
        symbol_image: croppedSymbols,
      };
  
      const response = await axios.post(
        "https://syeyumufgh.execute-api.us-east-1.amazonaws.com/prod/detect", 
        payload,
        {
          headers: { 
            "Content-Type": "application/json"
          }
        }
      );
      setDetectionResult(response.data);

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
    

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
        <div>
          <label>Crop symbol from below (zoomable)</label>
          <ImageCropper className="border-2" image={images.index} setCroppedImage={setCroppedSymbol} />
        </div>
        <div>
          <label>Blueprint (zoomable)</label>
          {images.blueprint && (
              <ZoomableImage imageSrc={images.blueprint} />
              // <ImageCropper className="border-2" image={images.blueprint} setCroppedSymbol={setCroppedBlueprint} />

          )}
        </div>
      </div>

      <hr className="py-2 mt-2"/>
      <label>Cropped Symbols</label>
      <div className="flex flex-row items-center gap-2 overflow-x-scroll mb-3 ">
        <div className="item-center ">
          <button  onClick={addCroppedSymbol}
          className="text-white text-3xl  bg-blue-700 hover:bg-blue-800 focus:outline-none font-medium rounded-lg px-4 py-2 text-center inline-flex items-center">
            +
          </button>
        </div>
        {croppedSymbols &&
        croppedSymbols.map((symbol, i) => (
          <div key={i} className="relative w-32 h-32">
            {/* Image */}
            <img
              src={symbol}
              alt={`Cropped Symbol ${i}`}
              className="w-full h-full border-2 rounded-lg object-contain"
            />
            {/* Trash Icon */}
            <button
              onClick={() => removeCroppedSymbol(i)}
              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
              title="Remove symbol"
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>

      {croppedSymbol && <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600" onClick={handleDetect}>Detect</button>}
      
      <hr className="py-2 mt-2"/>
      {detectionResult && (
        <div>
          <p>Detected Symbols: {detectionResult.symbol_count}</p>
          <ZoomableImage imageSrc={"data:image/png;base64,"+detectionResult.marked_image}  />
          {/* Display coordinates or other feedback here */}
        </div>
      )}
  </>
  );
}

export default DetectionScreen;

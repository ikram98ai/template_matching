import React, { useState, useEffect } from "react";
import { pdfToImage, readImageAsBase64 } from "../utils/utils";
import ImageCropper from "./ImageCropper";
import ZoomableImage from "./ZoomableImage";
import Spinner from "./Spinner";
import FeedbackPanel from "./FeedbackPanel";
import CropSymbols from "./CropSymbols";
import SymbolCanvas from "./SymbolCanvas"
// import detectSymbolsInBlueprint from "../utils/detection";
import axios from "axios";
import { Button } from "./Button";

function DetectionScreen({ files }) {
  const [images, setImages] = useState({ index: null, blueprint: null });
  const [croppedSymbols, setCroppedSymbols] = useState([]);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [threshold, setThreshold] = useState(0.9);
  const [nextSymbolNumber, setNextSymbolNumber] = useState(1);

  useEffect(() => {
    const convertPdfsToImages = async () => {
      setIsLoading(true); // Start loading
      try {
        let indexImage = null;
        let blueprintImage = null;

        if (files.index?.type == "application/pdf")
          indexImage = await pdfToImage(files.index);
        else indexImage = await readImageAsBase64(files.index);

        if (files.blueprint?.type == "application/pdf")
          blueprintImage = await pdfToImage(files.blueprint);
        else blueprintImage = await readImageAsBase64(files.blueprint);

        if (blueprintImage == null) blueprintImage = indexImage;

        setImages({ index: indexImage, blueprint: blueprintImage });
      } catch (error) {
        console.error("Error converting PDFs to images:", error);
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    if (files.index != null) {
      convertPdfsToImages();
    }
  }, [files]);

  const handleDetect = async () => {
    if (!croppedSymbols) {
      alert("Please crop or draw a symbol.");
      return;
    }
    setIsLoading(true); // Start loading

    try {


      const payload = {
        blueprint: images.blueprint,
        symbols: croppedSymbols,
        threshold: threshold
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

      // const result = await detectSymbolsInBlueprint(
      //   images.blueprint,
      //   croppedSymbols
      // );
      // setDetectionResult(result);
    } catch (error) {
      console.error("Error calling detectSymbolsInBlueprint:", error);
      alert(error.message);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const addCroppedSymbol = (newSymbol) => {
    setCroppedSymbols((prevCroppedSymbols) => [
      newSymbol,
      ...prevCroppedSymbols,
    ]);
  };

  const removeCroppedSymbol = (index) => {
    setCroppedSymbols((prevCroppedSymbols) =>
      prevCroppedSymbols.filter((_, i) => i !== index)
    );
  };

  const handleSymbolUpdate = (updatedSymbol) => {
    setCroppedSymbols((prev) =>
      prev.map((sym) => (sym.id === updatedSymbol.id ? updatedSymbol : sym))
    );
  };


  return (
    <>
      {isLoading && <Spinner />}
      <div className="flex flex-row gap-4">
        <div>
          <FeedbackPanel
            blueprintImg={images.blueprint}
            detectedSymbols={detectionResult?.detected_symbols}
            selectedSymbol={selectedSymbol}
            onSymbolSelect={setSelectedSymbol}
            onSymbolUpdate={handleSymbolUpdate}
          >
            <div>
              <CropSymbols
                croppedSymbols={croppedSymbols}
                removeCroppedSymbol={removeCroppedSymbol}
              />
              <label htmlFor="default-range" className="block text-sm font-medium text-gray-900 ">Threshold: {threshold}</label>
              <input id="default-range" type="range" value={threshold*100}  onChange={(e) => setThreshold(e.target.value/100)} className="w-full h-1 mb-6 bg-gray-200 rounded-lg appearance-none cursor-pointer range-sm dark:bg-gray-700"></input>
              <div className="flex justify-between">
                <Button
                  disabled={croppedSymbols.length <= 0}
                  onClick={handleDetect}
                  variant="outline"
                  size="sm" >
                  Detect
                </Button>
                <Button
                  disabled={detectionResult?.detected_symbols == null}
                  onClick={() => setDetectionResult(null)} // Instead of null
                  variant="outline"
                  size="sm" >
                  Clear
                </Button>

              </div>
              <hr className="py-2 mt-2" />
            </div>
          </FeedbackPanel>
        </div>

        <div className={"grid grid-cols-1 gap-4 py-6 sm:grid-cols-2"}>
          <div>
            <label className="text-xl font-semibold mb-4">Select symbol</label>
            <ImageCropper
              className="border-2"
              image={images.index}
              setCroppedImage={addCroppedSymbol} 
              nextSymbolNumber={nextSymbolNumber} setNextSymbolNumber={setNextSymbolNumber}
            />
          </div>
          <div>
            <label className="text-xl font-semibold mb-4">Draw symbol</label>
            <SymbolCanvas nextSymbolNumber={nextSymbolNumber} setNextSymbolNumber={setNextSymbolNumber} onSymbolAdd={addCroppedSymbol} />
          </div>

          {files.blueprint && (
            <div>
              <label className="text-xl font-semibold mb-4">Blueprint</label>
              <ZoomableImage imageSrc={images.blueprint} />
              {/* // <ImageCropper className="border-2" image={images.blueprint} setCroppedSymbol={setCroppedBlueprint} /> */}
            </div>
          )}

          {detectionResult && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Detected Symbols: {detectionResult.symbol_count}
              </h2>
              <ZoomableImage
                imageSrc={
                  "data:image/png;base64," + detectionResult.marked_image
                }
              />
              {/* Display coordinates or other feedback here */}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default DetectionScreen;

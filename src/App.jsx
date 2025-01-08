import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import DetectionScreen from "./components/DetectionScreen";

function App() {
  const [pdfs, setPdfs] = useState({ index: null, blueprint: null });

  return (
    <div className="container mx-auto p-4">
      {!pdfs.index && !pdfs.blueprint ? (
        <FileUpload setPdfs={setPdfs} />
      ) : (
        <DetectionScreen pdfs={pdfs} />
      )}
    </div>
  );
}

export default App;

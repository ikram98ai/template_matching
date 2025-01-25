import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import DetectionScreen from "./components/DetectionScreen";

function App() {
  const [files, setFiles] = useState({ index: null, blueprint: null });
  return (
    <div className="p-4 mt-5">
      {files.index ? (
        <DetectionScreen files={files} />
      ) : (
        <FileUpload setFiles={setFiles} />
      )}
    </div>
  );
}

export default App;

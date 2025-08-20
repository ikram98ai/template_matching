import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import DetectionScreen from "./components/DetectionScreen";
import Header from "./components/Header";

function App() {
  const [files, setFiles] = useState({ index: null, blueprint: null });
  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="p-4 sm:p-6 md:p-8">
        {files.index ? (
          <DetectionScreen files={files} />
        ) : (
          <FileUpload setFiles={setFiles} />
        )}
      </main>
    </div>
  );
}

export default App;

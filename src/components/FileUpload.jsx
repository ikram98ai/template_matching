import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

function FileUpload({ setFiles }) {
  const [file, setFile] = useState({
    index: null,
    blueprint: null,
  });

  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles, fileType) => {
    const file = acceptedFiles[0];
  
    setFile((prev) => ({
      ...prev,
      [fileType]: file,
    }));
    setError(null);
  }, []);

  const { getRootProps: getIndexProps, getInputProps: getIndexInputProps } =
    useDropzone({
      onDrop: (files) => onDrop(files, "index"),
      accept: { "application/pdf": [".pdf",], 'image/*': ['.png','.jpeg','.jpg'], },
      maxFiles: 1,
    });

  const {
    getRootProps: getBlueprintProps,
    getInputProps: getBlueprintInputProps,
  } = useDropzone({
    onDrop: (files) => onDrop(files, "blueprint"),
    accept: { "application/pdf": [".pdf",], 'image/*': ['.png','.jpeg','.jpg'], },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file.index ) {
      setError("Please upload index PDF/Image file");
      return;
    }
    setFiles(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        <div
          {...getIndexProps()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500"
        >
          <input {...getIndexInputProps()} />
          <p className="text-gray-600">
            {file.index
              ? file.index.name
              : "Drop index PDF/Image here or click to select"}
          </p>
        </div>

        <div
          {...getBlueprintProps()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500"
        >
          <input {...getBlueprintInputProps()} />
          <p className="text-gray-600">
            {file.blueprint
              ? file.blueprint.name
              : "Drop blueprint PDF/Image here or click to select"}
          </p>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          onClick={handleUpload}
          disabled={!file.index }
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          Upload Files
        </button>
      </div>
    </div>
  );
}

export default FileUpload;

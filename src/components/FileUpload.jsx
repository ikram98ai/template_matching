import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

function FileUpload({ setPdfs }) {
  const [files, setFiles] = useState({
    index: null,
    blueprint: null,
  });

  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles, fileType) => {
    const file = acceptedFiles[0];
    if (file?.type !== "application/pdf") {
      setError("Please upload PDF files only");
      return;
    }
    setFiles((prev) => ({
      ...prev,
      [fileType]: file,
    }));
    setError(null);
  }, []);

  const { getRootProps: getIndexProps, getInputProps: getIndexInputProps } =
    useDropzone({
      onDrop: (files) => onDrop(files, "index"),
      accept: { "application/pdf": [".pdf"] },
      maxFiles: 1,
    });

  const {
    getRootProps: getBlueprintProps,
    getInputProps: getBlueprintInputProps,
  } = useDropzone({
    onDrop: (files) => onDrop(files, "blueprint"),
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!files.index || !files.blueprint) {
      setError("Please upload both index and blueprint PDF files");
      return;
    }
    setPdfs(files);
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
            {files.index
              ? files.index.name
              : "Drop index PDF here or click to select"}
          </p>
        </div>

        <div
          {...getBlueprintProps()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500"
        >
          <input {...getBlueprintInputProps()} />
          <p className="text-gray-600">
            {files.blueprint
              ? files.blueprint.name
              : "Drop blueprint PDF here or click to select"}
          </p>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          onClick={handleUpload}
          disabled={!files.index || !files.blueprint}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          Upload Files
        </button>
      </div>
    </div>
  );
}

export default FileUpload;

import React, { useRef } from "react";
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";

const ImageCropper = ({ image, setCroppedImage }) => {
  const cropperRef = useRef(null);

  const handleCrop = () => {
    const cropper = cropperRef.current.cropper;
    const croppedImage = cropper.getCroppedCanvas().toDataURL();
    if (croppedImage) setCroppedImage(croppedImage); // Set the cropped image as a data URL
  };

  return (
    <Cropper
      src={image}
      // style={{ height: "100%", width: "100%" }}
      initialAspectRatio={1}
      guides={true}
      dragMode="move"
      ref={cropperRef}
      viewMode={1}
      crop={handleCrop}
    />
  );
};

export default ImageCropper;

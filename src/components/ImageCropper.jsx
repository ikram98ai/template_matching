import React, { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './Button';

export default function ImageCropper({ image, setCroppedImage }) {
  const [crop, setCrop] = useState(null);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#ff0000');
  const [nextSymbolNumber, setNextSymbolNumber] = useState(1);
  const imageRef = useRef(null);
  const [scaleFactor, setScaleFactor] = useState(1);


  const getCroppedImg = async () => {
    if (!imageRef.current || !crop) return;

    const image = imageRef.current;
    const scaleX = image.naturalWidth / image.clientWidth;
    const scaleY = image.naturalHeight / image.clientHeight;

    const canvas = document.createElement('canvas');
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return canvas.toDataURL('image/png');
  };

  const handleCropComplete = async (crop) => {
    if (!image || !crop.width || !crop.height) return;

    const croppedImage = await getCroppedImg(image, crop);
    const symbolLabel = label || `symbol${nextSymbolNumber}`;
    
    setCroppedImage({
      image: croppedImage,
      label: symbolLabel,
      color,
    });
    
    if (!label) setNextSymbolNumber(prev => prev + 1);
    setLabel('');
  };

  return (
    <div className="space-y-4">
      <ReactCrop
        crop={crop}
        onChange={setCrop}
        aspect={undefined}
      >
        <img
          ref={imageRef}
          src={image}
          alt="Source"
          style={{ 
            maxWidth: '100%',
            height: 'auto',
            // Add these to maintain image quality
            imageRendering: '-webkit-optimize-contrast',
            // imageRendering: 'crisp-edges'
          }}
          onLoad={(e) => {
            // Calculate scale factor when image loads
            const scaleX = e.target.naturalWidth / e.target.clientWidth;
            const scaleY = e.target.naturalHeight / e.target.clientHeight;
            setScaleFactor(Math.max(scaleX, scaleY));
          }}
        />
      </ReactCrop>
      {/* <div className="scale-warning" style={{ marginTop: '10px' }}>
        {scaleFactor > 1 && (
          <span style={{ color: '#ff9800' }}>
            ⚠️ Image is scaled down ({scaleFactor.toFixed(1)}x). 
            Cropping will use original resolution.
          </span>
        )}
      </div> */}

      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Label (e.g. resistor)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="flex-1 p-1 border rounded"
        />
        
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-4 h-8"
        />
        <Button
          onClick={() => handleCropComplete(crop)}
          variant="outline"
        >
          Crop
        </Button>
      
      </div>
    </div>
  );
}


// import React, { useRef } from "react";
// import { Cropper } from "react-cropper";
// import "cropperjs/dist/cropper.css";

// const ImageCropper = ({ image, setCroppedImage }) => {
//   const cropperRef = useRef(null);

//   const handleCrop = () => {
//     const cropper = cropperRef.current.cropper;
//     const croppedImage = cropper.getCroppedCanvas().toDataURL();
//     if (croppedImage) setCroppedImage(croppedImage); // Set the cropped image as a data URL
//   };

//   return (
//     <Cropper
//       src={image}
//       // style={{ height: "100%", width: "100%" }}
//       initialAspectRatio={1}
//       guides={true}
//       dragMode="move"
//       ref={cropperRef}
//       viewMode={1}
//       crop={handleCrop}
//     />
//   );
// };

// export default ImageCropper;

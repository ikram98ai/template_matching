import React from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const ZoomableImage = ({ imageSrc }) => {
  return (
    <div className="w-full">
      <TransformWrapper>
            <TransformComponent>
              <img
                src={imageSrc}
                alt="Zoomable"
                className="max-w-full max-h-full"
              />
            </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default ZoomableImage;

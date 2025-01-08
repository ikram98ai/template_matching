export default async function getCroppedImg(imageSrc, cropArea) {
    const image = new Image();
    image.src = imageSrc;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
  
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
  
    ctx.drawImage(
      image,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      cropArea.width,
      cropArea.height
    );
  
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject('Canvas is empty');
          return;
        }
        const croppedImageURL = URL.createObjectURL(blob);
        resolve(croppedImageURL);
      }, 'image/jpeg');
    });
  }
  
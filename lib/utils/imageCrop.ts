type Crop = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  index: number;
};
export const cropImageFromArrayBuffer = async (
  arrayBuffer: ArrayBuffer | Buffer,
  crop: Crop
): Promise<{ blob: Blob; arrayBuffer: ArrayBuffer }> => {
  return new Promise((resolve, reject) => {
    // Convert Buffer to ArrayBuffer if needed
    const buffer: ArrayBuffer = arrayBuffer instanceof Buffer
      ? (arrayBuffer.buffer.slice(arrayBuffer.byteOffset, arrayBuffer.byteOffset + arrayBuffer.byteLength) as ArrayBuffer)
      : arrayBuffer;

    // Convert the ArrayBuffer to a Blob (set MIME type accordingly)
    const blob = new Blob([buffer], { type: "image/png" });
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.src = url;

    img.onload = () => {
      const cropWidth = img.width;
      const cropHeight = crop.yMax - crop.yMin;

      const canvas = document.createElement("canvas");
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("Could not get canvas context"));
      }

      ctx.drawImage(
        img,
        0, // source x (full width starts at 0)
        crop.yMin, // source y (crop starting position)
        cropWidth, // source width (full width)
        cropHeight, // source height (cropped portion)
        0, // destination x on canvas
        0, // destination y on canvas
        cropWidth, // destination width
        cropHeight // destination height
      );

      canvas.toBlob(async (croppedBlob) => {
        URL.revokeObjectURL(url);
        if (croppedBlob) {
          try {
            // Convert the cropped Blob to an ArrayBuffer.
            const croppedArrayBuffer = await croppedBlob.arrayBuffer();
            resolve({ blob: croppedBlob, arrayBuffer: croppedArrayBuffer });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error("Canvas is empty"));
        }
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load the image"));
    };
  });
};

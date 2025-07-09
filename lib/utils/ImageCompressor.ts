import imageCompression from "browser-image-compression";

export const handleImageCompress = async (
  imageFile: File,
  onProgress?: (progress: number) => void
) => {
  const options = {
    maxSizeMB: 0.4,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    ...(onProgress && { onProgress: onProgress }),
  };
  const compressedFile = await imageCompression(imageFile, options);

  return compressedFile;
};

import { Buffer } from "buffer";

export const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result.toString());
      } else {
        reject(new Error("File reading failed"));
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };
  });
};
export const getImageUrl = (key: string): string => {
  return `${process.env.NEXT_PUBLIC_API_URL}/images/image-file?filePath=${key}`;
};

export const base64ToArrayBuffer = (base64String: string) => {
  const regex = /^data:([^;]+);base64,/;
  const result = base64String.match(regex);

  const base64Clean = base64String.split(",").pop();
  const binaryString = window.atob(base64Clean!);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const buffer = Buffer.from(bytes.buffer);
  const blob = new Blob([bytes], { type: result ? result[1] : "image/jpeg" });
  const blobFile = new File([blob], `${new Date().getTime()}.jpg`, {
    type: blob.type,
    lastModified: Date.now(),
  });

  return { file: buffer, blobFile, contentType: result ? result[1] : null };
};

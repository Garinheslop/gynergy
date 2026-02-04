"use client";
import { S3Client, UploadPartCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_KEY,
  },
  region: process.env.NEXT_PUBLIC_AWS_BUCKET_REGION,
});

export const uploadChunk = async (uploadId, partNumber, file, key) => {
  const command = new UploadPartCommand({
    Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
    Body: file,
    Key: key,
    PartNumber: Number(partNumber) + 1,
    UploadId: uploadId,
  });
  return s3.send(command);
};

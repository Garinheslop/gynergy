import React, { useEffect, useState } from "react";

import { useSelector } from "react-redux";

import { handleImageCompress } from "@lib/utils/ImageCompressor";
import Image from "@modules/common/components/Image";
import { RootState } from "@store/configureStore";

type ImageState = { src?: string } | { path?: string } | null;

type ProfileImageProps = {
  onFileChangeHandler?: (file: File) => void;
};

function ProfileImage({ onFileChangeHandler }: ProfileImageProps) {
  const profile = useSelector((state: RootState) => state.profile);
  const [image, setImage] = useState<ImageState>(null);

  useEffect(() => {
    if (profile.current?.profileImage) {
      setImage({ path: profile?.current?.profileImage });
    }
  }, [profile?.current]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleImageChange");

    const file = e.target.files?.[0];
    if (file?.name) {
      const compressedFile = await handleImageCompress(file);
      compressedFile.arrayBuffer().then((arrBuf) => {
        const image = new Blob([arrBuf], { type: "image/jpeg" });
        const imageUrl = URL.createObjectURL(image);
        const buffer = Buffer.from(arrBuf);
        const bufferStr = buffer.toString("base64");
        setImage({ src: imageUrl });
        const imageData: any = {
          name: file.name,
          fileStr: bufferStr,
          contentType: file.type,
        };
        onFileChangeHandler && onFileChangeHandler(imageData);
      });
    }
  };
  return (
    <div className="relative mx-auto w-fit overflow-hidden">
      <Image
        src={image && "src" in image ? image.src : undefined}
        path={image && "path" in image ? image.path : undefined}
        className="border-border-dark h-[100px] w-[100px] rounded-full border-2 object-cover sm:h-[142px] sm:w-[142px]"
      />
      <label
        htmlFor="image-upload"
        className="absolute right-0 bottom-0 cursor-pointer sm:right-1 sm:bottom-2"
      >
        <input
          type="file"
          accept="image/jpg, image/jpeg"
          id="image-upload"
          onChange={handleImageChange}
          hidden
        />
        <div className="bg-bkg-dark w-fit rounded-full px-3 py-2.5">
          <i className="gng-add-photo-filled text-content-light h-5 w-5" />
        </div>
      </label>
    </div>
  );
}
export default ProfileImage;

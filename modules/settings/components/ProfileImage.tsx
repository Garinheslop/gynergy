import { handleImageCompress } from "@lib/utils/ImageCompressor";
import Image from "@modules/common/components/Image";
import { RootState } from "@store/configureStore";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

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
    <div className="w-fit mx-auto relative overflow-hidden">
      <Image
        src={image && "src" in image ? image.src : undefined}
        path={image && "path" in image ? image.path : undefined}
        className="sm:h-[142px] sm:w-[142px] h-[100px] w-[100px] rounded-full border-2 border-border-dark object-cover"
      />
      <label
        htmlFor="image-upload"
        className="cursor-pointer absolute sm:bottom-2 bottom-0 sm:right-1 right-0"
      >
        <input
          type="file"
          accept="image/jpg, image/jpeg"
          id="image-upload"
          onChange={handleImageChange}
          hidden
        />
        <div className="bg-bkg-dark w-fit px-3 py-2.5 rounded-full">
          <i className="gng-add-photo-filled h-5 w-5 text-content-light" />
        </div>
      </label>
    </div>
  );
}
export default ProfileImage;

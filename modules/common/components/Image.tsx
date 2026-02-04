import { FC, useEffect, useState } from "react";

import NextImage from "next/image";

import { useSession } from "@contexts/UseSession";
import { createClient } from "@lib/supabase-client";
import { cn } from "@lib/utils/style";
import images from "@resources/images";

interface ImageProps {
  path?: string;
  className?: string;
  src?: string;
  alt?: string;
  onErrorImage?: string;
  onClick?: React.MouseEventHandler<HTMLImageElement>;
}

const Image: FC<ImageProps> = ({
  path,
  className,
  src,
  alt = "image",
  onErrorImage = images.placeholders.image,
  onClick,
}) => {
  const { session } = useSession();
  const [imageUrl, setImageUrl] = useState<string>(onErrorImage);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  useEffect(() => {
    if (!path && src) {
      setImageUrl(src);
    }
  }, [src, path]);

  useEffect(() => {
    if (!loading && path && session && (!lastFetched || path !== lastFetched)) {
      setLoading(true);
      const fetchImageUrl = async () => {
        const { data, error } = await createClient()
          .storage.from(`${process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME!}`)
          .download(path);
        if (error) {
          // console.log("Error fetching image:", error);
        } else {
          const imageUrl = URL.createObjectURL(data);
          setImageUrl(imageUrl);
          setLastFetched(path);
        }
        setLoading(false);
      };

      fetchImageUrl();
    } else if (!path && !src) {
      setImageUrl(onErrorImage);
    }
  }, [path, session]);

  return (
    <>
      {imageUrl ? (
        <NextImage
          aria-label="image-url"
          className={cn("shrink-0", className)}
          loader={() => imageUrl}
          unoptimized={true}
          src={imageUrl}
          alt={alt}
          height={100}
          width={100}
          referrerPolicy="no-referrer"
          onClick={onClick}
          onError={() => {
            if (onErrorImage) setImageUrl(onErrorImage);
          }}
        />
      ) : (
        <NextImage
          aria-label="image-without-url"
          className={cn("shrink-0", className)}
          loader={() => onErrorImage}
          unoptimized={true}
          src={onErrorImage}
          alt={alt}
          height={100}
          width={100}
          referrerPolicy="no-referrer"
          onClick={onClick}
        />
      )}
    </>
  );
};

export default Image;

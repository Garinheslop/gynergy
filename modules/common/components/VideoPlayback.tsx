import { useEffect, useRef, useState } from "react";
//images
import images from "@resources/images";
import Image from "./Image";
import { cn } from "@lib/utils/style";
import ActionButton from "./ActionButton";

const VideoPlayback = ({ url = "", sx }: { url: string; sx?: string }) => {
  const iframeRef = useRef(null);
  const [play, setPlay] = useState(false);
  const [videoSrc, setVideoSrc] = useState(url);

  useEffect(() => {
    setVideoSrc(url);
  }, [url]);

  useEffect(() => {
    if (play) {
      setVideoSrc(
        videoSrc.includes("autoplay=1")
          ? videoSrc
          : `${videoSrc}${videoSrc.includes("?") ? "&" : "?"}autoplay=1`
      );
    }
  }, [play]);

  return (
    <div
      className={cn(
        "relative aspect-video rounded-[20px] border border-border-light overflow-hidden",
        sx
      )}
    >
      {videoSrc ? (
        <iframe
          className="h-full w-full sm:rounded"
          src={videoSrc}
          loading="lazy"
          allow="fullscreen; picture-in-picture"
          allowFullScreen
          ref={iframeRef}
        />
      ) : (
        <Image className="h-full w-full" src={images.placeholders.video} alt="video" />
      )}
      {/* {!play && (
        <div
          className="absolute group top-0 left-0 flex w-full h-full cursor-pointer items-center justify-center rounded bg-bkg-dark/50 hover:bg-bkg-dark/20 overflow-hidden duration-150"
          onClick={() => setPlay(true)}
        >
          <ActionButton
            label="Play Video"
            icon="play"
            sx={cn(
              "w-max flex-row-reverse group-hover:[&>i]:ml-[5px] group-hover:bg-action-secondary"
            )}
          />
        </div>
      )} */}
    </div>
  );
};

export default VideoPlayback;

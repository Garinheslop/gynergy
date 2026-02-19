"use client";

import { useState, useCallback } from "react";

import { WEBINAR_FULL_DISPLAY } from "@lib/config/webinar";
import { cn } from "@lib/utils/style";

interface WebinarVideoProps {
  videoId: string | null;
  platform?: "youtube" | "vimeo";
  fallbackImage?: string;
  onPlay?: () => void;
  className?: string;
}

type VideoState = "placeholder" | "loading" | "playing" | "error";

// Pillar icons for the compelling placeholder
function PillarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45-6.9 3.45-6.9-3.45L12 4.18zM4 8.64l7 3.5v6.72l-7-3.5V8.64zm9 10.22V12.14l7-3.5v6.72l-7 3.5z" />
    </svg>
  );
}

function InfinityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66 10.48 12h.01L7.8 14.39c-.64.64-1.49.99-2.4.99-1.87 0-3.39-1.51-3.39-3.38S3.53 8.62 5.4 8.62c.91 0 1.76.35 2.44 1.03l1.13 1 1.51-1.34L9.22 8.2C8.2 7.18 6.84 6.62 5.4 6.62 2.42 6.62 0 9.04 0 12s2.42 5.38 5.4 5.38c1.44 0 2.8-.56 3.77-1.53l2.83-2.5.01.01L13.52 12h-.01l2.69-2.39c.64-.64 1.49-.99 2.4-.99 1.87 0 3.39 1.51 3.39 3.38s-1.52 3.38-3.39 3.38c-.9 0-1.76-.35-2.44-1.03l-1.14-1.01-1.51 1.34 1.27 1.12c1.02 1.01 2.37 1.57 3.82 1.57 2.98 0 5.4-2.41 5.4-5.38s-2.42-5.37-5.4-5.37z" />
    </svg>
  );
}

export default function WebinarVideo({
  videoId,
  platform = "youtube",
  fallbackImage,
  onPlay,
  className,
}: WebinarVideoProps) {
  const [state, setState] = useState<VideoState>("placeholder");
  const [isMuted, setIsMuted] = useState(true);

  const handlePlay = useCallback(() => {
    if (!videoId) {
      // No video yet - show placeholder state
      return;
    }

    setState("loading");

    // Simulate iframe load time
    setTimeout(() => {
      setState("playing");
      onPlay?.();
    }, 500);
  }, [videoId, onPlay]);

  const handleError = useCallback(() => {
    setState("error");
  }, []);

  const handleRetry = useCallback(() => {
    setState("placeholder");
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Build embed URL based on platform
  const getEmbedUrl = () => {
    if (!videoId) return "";

    if (platform === "youtube") {
      const muteParam = isMuted ? "&mute=1" : "&mute=0";
      return `https://www.youtube.com/embed/${videoId}?autoplay=1${muteParam}&rel=0&modestbranding=1&playsinline=1`;
    }

    if (platform === "vimeo") {
      const muteParam = isMuted ? "&muted=1" : "&muted=0";
      return `https://player.vimeo.com/video/${videoId}?autoplay=1${muteParam}&playsinline=1`;
    }

    return "";
  };

  return (
    <div
      className={cn(
        "relative mx-auto aspect-video w-full max-w-[1200px]",
        "bg-lp-black border-lp-border border",
        "overflow-hidden",
        className
      )}
    >
      {/* Placeholder state */}
      {state === "placeholder" && (
        <button
          onClick={handlePlay}
          className={cn(
            "absolute inset-0 h-full w-full",
            "flex flex-col items-center justify-center",
            "cursor-pointer border-none bg-transparent",
            "group",
            !videoId && "cursor-default"
          )}
          style={{
            background: fallbackImage
              ? `url(${fallbackImage}) center/cover no-repeat`
              : `
                  radial-gradient(ellipse 60% 40% at 50% 45%, rgba(184,148,62,0.12) 0%, transparent 60%),
                  radial-gradient(circle at 20% 30%, rgba(184,148,62,0.05) 0%, transparent 40%),
                  radial-gradient(circle at 80% 70%, rgba(184,148,62,0.05) 0%, transparent 40%),
                  linear-gradient(180deg, #0a0908 0%, #0D0C0A 100%)
                `,
          }}
          disabled={!videoId}
          aria-label={videoId ? "Play training video" : "Video coming soon"}
        >
          {/* Overlay for fallback image */}
          {fallbackImage && <div className="bg-lp-black/40 absolute inset-0" />}

          {/* Decorative corner elements */}
          <div className="absolute top-4 left-4 h-8 w-8 opacity-30">
            <div className="bg-lp-gold/50 absolute top-0 left-0 h-full w-px" />
            <div className="bg-lp-gold/50 absolute top-0 left-0 h-px w-full" />
          </div>
          <div className="absolute top-4 right-4 h-8 w-8 opacity-30">
            <div className="bg-lp-gold/50 absolute top-0 right-0 h-full w-px" />
            <div className="bg-lp-gold/50 absolute top-0 right-0 h-px w-full" />
          </div>
          <div className="absolute bottom-4 left-4 h-8 w-8 opacity-30">
            <div className="bg-lp-gold/50 absolute bottom-0 left-0 h-full w-px" />
            <div className="bg-lp-gold/50 absolute bottom-0 left-0 h-px w-full" />
          </div>
          <div className="absolute right-4 bottom-4 h-8 w-8 opacity-30">
            <div className="bg-lp-gold/50 absolute right-0 bottom-0 h-full w-px" />
            <div className="bg-lp-gold/50 absolute right-0 bottom-0 h-px w-full" />
          </div>

          {/* Content container */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Infinity symbol above play button when no video */}
            {!videoId && <InfinityIcon className="text-lp-gold/30 mb-4 h-8 w-8" />}

            {/* Play Button */}
            <div
              className={cn(
                "relative",
                "h-20 w-20 rounded-full md:h-24 md:w-24",
                "flex items-center justify-center",
                "transition-all duration-300",
                videoId
                  ? "bg-lp-gold shadow-[0_0_40px_rgba(184,148,62,0.3)] group-hover:scale-110 group-hover:shadow-[0_0_60px_rgba(184,148,62,0.4)]"
                  : "border-lp-gold/40 bg-lp-gold/10 border-2"
              )}
            >
              <svg
                className={cn(
                  "ml-1 h-8 w-8 md:h-10 md:w-10",
                  videoId ? "fill-lp-black" : "fill-lp-gold/60"
                )}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>

            <span
              className={cn(
                "font-oswald mt-6 text-sm font-light tracking-widest uppercase",
                videoId ? "text-lp-white" : "text-lp-gold-light"
              )}
            >
              {videoId ? "Watch the Free Training" : "Live Training"}
            </span>

            {!videoId && (
              <>
                <span className="font-bebas text-lp-white mt-2 text-xl tracking-wide md:text-2xl">
                  {WEBINAR_FULL_DISPLAY}
                </span>
                <span className="font-oswald text-lp-gray mt-3 max-w-[300px] text-center text-xs leading-relaxed font-extralight">
                  Register above to secure your seat for the live training with Garin Heslop
                </span>

                {/* Pillar indicators */}
                <div className="mt-6 flex items-center gap-3">
                  {["Wealth", "Health", "Relationships", "Growth", "Purpose"].map((pillar) => (
                    <div key={pillar} className="group/pillar flex flex-col items-center">
                      <PillarIcon className="text-lp-gold/40 group-hover/pillar:text-lp-gold h-4 w-4 transition-colors" />
                      <span className="font-oswald text-lp-muted mt-1 text-[8px] font-extralight tracking-wider uppercase opacity-0 transition-opacity group-hover/pillar:opacity-100">
                        {pillar}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </button>
      )}

      {/* Loading state */}
      {state === "loading" && (
        <div className="bg-lp-black absolute inset-0 flex items-center justify-center">
          <div className="border-lp-gold h-12 w-12 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      )}

      {/* Playing state */}
      {state === "playing" && videoId && (
        <>
          <iframe
            src={getEmbedUrl()}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="The 5 Pillars of Integrated Power - Free Live Training"
            onError={handleError}
          />

          {/* Unmute button (overlay in corner) */}
          {isMuted && (
            <button
              onClick={toggleMute}
              className={cn(
                "absolute right-4 bottom-4 z-10",
                "rounded px-4 py-2",
                "bg-lp-gold text-lp-black",
                "font-oswald text-xs font-medium tracking-wider uppercase",
                "transition-all duration-200",
                "hover:bg-lp-gold-light"
              )}
            >
              Tap to Unmute
            </button>
          )}
        </>
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="bg-lp-black absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-oswald text-lp-white mb-4 text-lg">Unable to load video</p>
          <button
            onClick={handleRetry}
            className={cn(
              "rounded px-6 py-2",
              "bg-lp-gold text-lp-black",
              "font-oswald text-sm font-medium tracking-wider uppercase",
              "transition-all duration-200",
              "hover:bg-lp-gold-light"
            )}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

import { cn } from "@lib/utils/style";

import { SectionWrapper } from "../shared";

interface VSLSectionProps {
  videoUrl?: string;
}

export default function VSLSection({ videoUrl }: VSLSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    if (videoUrl) {
      setIsPlaying(true);
    }
  };

  return (
    <SectionWrapper variant="dark" className="py-12 md:py-16">
      <div className="mb-6 text-center">
        <p className="font-oswald text-lp-gold/60 text-sm font-light tracking-wider italic">
          Watch Garin explain the method
        </p>
      </div>

      <div className="mx-auto max-w-[800px]">
        <div
          className={cn(
            "relative aspect-video",
            "bg-lp-card border-lp-border border",
            "overflow-hidden"
          )}
        >
          {isPlaying && videoUrl ? (
            <iframe
              src={videoUrl}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              onClick={handlePlay}
              className={cn(
                "absolute inset-0 h-full w-full",
                "flex flex-col items-center justify-center",
                "cursor-pointer border-none bg-transparent",
                "group"
              )}
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(184,148,62,0.03) 0%, transparent 60%)",
              }}
            >
              {/* Play Button */}
              <div
                className={cn(
                  "h-16 w-16 rounded-full md:h-20 md:w-20",
                  "border-lp-gold border-2",
                  "flex items-center justify-center",
                  "transition-all duration-300",
                  "group-hover:bg-lp-gold/10 group-hover:scale-110"
                )}
              >
                <svg className="fill-lp-gold ml-1 h-6 w-6 md:h-7 md:w-7" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>

              <span className="font-oswald text-lp-muted mt-4 text-xs font-light tracking-widest uppercase">
                Watch the Free Training
              </span>
            </button>
          )}
        </div>
      </div>
    </SectionWrapper>
  );
}

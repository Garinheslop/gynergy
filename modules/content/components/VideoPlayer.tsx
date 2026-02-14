"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

import Hls from "hls.js";

import { cn } from "@lib/utils/style";

// =============================================================================
// TYPES
// =============================================================================

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  startAt?: number;
  autoPlay?: boolean;
  onProgress?: (percent: number, currentTime: number) => void;
  onComplete?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface QualityLevel {
  height: number;
  bitrate: number;
  label: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  startAt = 0,
  autoPlay = false,
  onProgress,
  onComplete,
  onTimeUpdate,
  onError,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressUpdateRef = useRef<number>(0);
  const hasCompletedRef = useRef(false);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = auto
  const [showSettings, setShowSettings] = useState(false);

  // Hide controls timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // =============================================================================
  // HLS SETUP
  // =============================================================================

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Reset state
    setIsLoading(true);
    setErrorMessage(null);
    hasCompletedRef.current = false;

    const initPlayer = () => {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });

        hls.loadSource(src);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          setIsLoading(false);

          // Extract quality levels
          const levels: QualityLevel[] = data.levels.map((level) => ({
            height: level.height,
            bitrate: level.bitrate,
            label: `${level.height}p`,
          }));
          setQualityLevels(levels);

          // Start at saved position
          if (startAt > 0) {
            video.currentTime = startAt;
          }

          if (autoPlay) {
            video.play().catch(() => {
              // Autoplay blocked, that's ok
            });
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
          setCurrentQuality(data.level);
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            const errorMsg = `Playback error: ${data.type}`;
            setErrorMessage(errorMsg);
            setIsLoading(false);
            onError?.(errorMsg);

            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // Try to recover
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });

        return () => {
          hls.destroy();
        };
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS support
        video.src = src;
        setIsLoading(false);

        if (startAt > 0) {
          video.currentTime = startAt;
        }

        if (autoPlay) {
          video.play().catch(() => {});
        }
      } else {
        const errorMsg = "HLS playback not supported in this browser";
        setErrorMessage(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, startAt, autoPlay, onError]);

  // =============================================================================
  // VIDEO EVENT HANDLERS
  // =============================================================================

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);

      // Throttle progress updates
      const now = Date.now();
      if (now - progressUpdateRef.current > 5000) {
        // Every 5 seconds
        progressUpdateRef.current = now;
        const percent = (time / video.duration) * 100;
        onProgress?.(percent, time);

        // Check for completion (95%)
        if (percent >= 95 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete?.();
        }
      }
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / video.duration) * 100;
        setBuffered(bufferedPercent);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete?.();
        onProgress?.(100, video.duration);
      }
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("volumechange", handleVolumeChange);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [onProgress, onComplete, onTimeUpdate]);

  // =============================================================================
  // CONTROLS
  // =============================================================================

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(time, video.duration));
  }, []);

  const seekRelative = useCallback(
    (delta: number) => {
      seek(currentTime + delta);
    },
    [currentTime, seek]
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      seek(percent * duration);
    },
    [duration, seek]
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const changeVolume = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.max(0, Math.min(1, newVolume));
    if (newVolume > 0) {
      video.muted = false;
    }
  }, []);

  const changeSpeed = useCallback((speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettings(false);
  }, []);

  const changeQuality = useCallback((level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setCurrentQuality(level);
    }
    setShowSettings(false);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // =============================================================================
  // KEYBOARD CONTROLS
  // =============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if container is focused or video is playing
      if (!containerRef.current?.contains(document.activeElement) && !isPlaying) {
        return;
      }

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekRelative(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekRelative(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(volume + 0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(volume - 0.1);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          e.preventDefault();
          seek((parseInt(e.key) / 10) * duration);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    togglePlay,
    seekRelative,
    changeVolume,
    toggleMute,
    toggleFullscreen,
    seek,
    volume,
    duration,
    isPlaying,
  ]);

  // =============================================================================
  // CONTROLS VISIBILITY
  // =============================================================================

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
    }
  }, [isPlaying]);

  // =============================================================================
  // HELPERS
  // =============================================================================

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  if (errorMessage) {
    return (
      <div
        className={cn(
          "relative flex aspect-video items-center justify-center rounded-lg bg-black",
          className
        )}
      >
        <div className="p-6 text-center text-white">
          <i className="gng-warning mb-4 block text-4xl text-red-500" />
          <p className="mb-2 text-lg">Failed to load video</p>
          <p className="text-sm text-gray-400">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative aspect-video overflow-hidden rounded-lg bg-black",
        isFullscreen && "rounded-none",
        className
      )}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        className="h-full w-full object-contain"
        onClick={togglePlay}
        playsInline
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
      )}

      {/* Play Button Overlay (when paused) */}
      {!isPlaying && !isLoading && (
        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center"
          onClick={togglePlay}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30">
            <i className="gng-play ml-1 text-4xl text-white" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end transition-opacity duration-300",
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Title */}
        {title && (
          <div className="absolute top-4 right-4 left-4">
            <h3 className="truncate text-lg font-medium text-white">{title}</h3>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-2 px-4">
          <div
            role="slider"
            tabIndex={0}
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            className="group/progress h-1 cursor-pointer rounded bg-white/30"
            onClick={handleProgressClick}
          >
            {/* Buffered */}
            <div className="absolute h-1 rounded bg-white/50" style={{ width: `${buffered}%` }} />
            {/* Progress */}
            <div
              className="bg-action absolute h-1 rounded"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            {/* Scrubber */}
            <div
              className="absolute -mt-1 -ml-1.5 h-3 w-3 rounded-full bg-white opacity-0 transition-opacity group-hover/progress:opacity-100"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-4 px-4 pb-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="hover:text-action text-white transition-colors"
            title={isPlaying ? "Pause (k)" : "Play (k)"}
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            <i className={`text-xl ${isPlaying ? "gng-pause" : "gng-play"}`} aria-hidden="true" />
          </button>

          {/* Skip Back */}
          <button
            onClick={() => seekRelative(-10)}
            className="hover:text-action text-white transition-colors"
            title="Back 10s"
            aria-label="Skip back 10 seconds"
          >
            <i className="gng-skip-back text-lg" aria-hidden="true" />
          </button>

          {/* Skip Forward */}
          <button
            onClick={() => seekRelative(10)}
            className="hover:text-action text-white transition-colors"
            title="Forward 10s"
            aria-label="Skip forward 10 seconds"
          >
            <i className="gng-skip-forward text-lg" aria-hidden="true" />
          </button>

          {/* Volume */}
          <div className="group/volume flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="hover:text-action text-white transition-colors"
              title={isMuted ? "Unmute (m)" : "Mute (m)"}
              aria-label={isMuted ? "Unmute" : "Mute"}
              aria-pressed={isMuted}
            >
              <i
                className={`text-lg ${isMuted || volume === 0 ? "gng-volume-x" : "gng-volume-2"}`}
                aria-hidden="true"
              />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className="accent-action w-0 transition-all duration-200 group-hover/volume:w-20"
              aria-label="Volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((isMuted ? 0 : volume) * 100)}
            />
          </div>

          {/* Time */}
          <span className="text-sm text-white">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="hover:text-action text-white transition-colors"
              title="Settings"
              aria-label="Video settings"
              aria-expanded={showSettings}
              aria-haspopup="menu"
            >
              <i className="gng-settings text-lg" aria-hidden="true" />
            </button>

            {showSettings && (
              <div className="absolute right-0 bottom-full mb-2 min-w-[200px] rounded-lg bg-black/90 p-2">
                {/* Playback Speed */}
                <div className="mb-2">
                  <p className="mb-1 px-2 text-xs text-gray-400">Playback Speed</p>
                  <div className="flex flex-wrap gap-1">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => changeSpeed(speed)}
                        className={cn(
                          "rounded px-2 py-1 text-sm",
                          playbackSpeed === speed
                            ? "bg-action text-white"
                            : "text-white hover:bg-white/10"
                        )}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality */}
                {qualityLevels.length > 0 && (
                  <div>
                    <p className="mb-1 px-2 text-xs text-gray-400">Quality</p>
                    <div className="flex flex-col">
                      <button
                        onClick={() => changeQuality(-1)}
                        className={cn(
                          "rounded px-2 py-1 text-left text-sm",
                          currentQuality === -1
                            ? "bg-action text-white"
                            : "text-white hover:bg-white/10"
                        )}
                      >
                        Auto
                      </button>
                      {qualityLevels.map((level, index) => (
                        <button
                          key={index}
                          onClick={() => changeQuality(index)}
                          className={cn(
                            "rounded px-2 py-1 text-left text-sm",
                            currentQuality === index
                              ? "bg-action text-white"
                              : "text-white hover:bg-white/10"
                          )}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="hover:text-action text-white transition-colors"
            title={isFullscreen ? "Exit fullscreen (f)" : "Fullscreen (f)"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <i
              className={`text-lg ${isFullscreen ? "gng-minimize" : "gng-maximize"}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;

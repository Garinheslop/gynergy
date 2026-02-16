"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";

import { useHMSActions } from "@100mslive/react-sdk";

import { cn } from "@lib/utils/style";

// Dynamically import the virtual background plugin to avoid SSR issues
let HMSVirtualBackgroundPlugin: any = null;

interface VirtualBackgroundProps {
  onClose?: () => void;
  isOpen: boolean;
  videoTrack?: MediaStreamTrack | null;
}

interface BackgroundOption {
  id: string;
  type: "none" | "blur" | "image";
  label: string;
  preview?: string;
  blurAmount?: number;
}

// Preset backgrounds - premium wellness-themed options
const PRESET_BACKGROUNDS: BackgroundOption[] = [
  {
    id: "none",
    type: "none",
    label: "None",
  },
  {
    id: "blur-light",
    type: "blur",
    label: "Light Blur",
    blurAmount: 0.5,
  },
  {
    id: "blur-medium",
    type: "blur",
    label: "Medium Blur",
    blurAmount: 0.75,
  },
  {
    id: "blur-heavy",
    type: "blur",
    label: "Strong Blur",
    blurAmount: 1,
  },
];

// Premium background images (placeholders - would be actual CDN URLs in production)
const BACKGROUND_IMAGES = [
  {
    id: "zen-garden",
    label: "Zen Garden",
    preview: "/backgrounds/zen-garden.jpg",
    url: "/backgrounds/zen-garden.jpg",
  },
  {
    id: "mountain-sunrise",
    label: "Mountain Sunrise",
    preview: "/backgrounds/mountain-sunrise.jpg",
    url: "/backgrounds/mountain-sunrise.jpg",
  },
  {
    id: "peaceful-lake",
    label: "Peaceful Lake",
    preview: "/backgrounds/peaceful-lake.jpg",
    url: "/backgrounds/peaceful-lake.jpg",
  },
  {
    id: "forest-path",
    label: "Forest Path",
    preview: "/backgrounds/forest-path.jpg",
    url: "/backgrounds/forest-path.jpg",
  },
  {
    id: "minimalist-studio",
    label: "Studio",
    preview: "/backgrounds/minimalist-studio.jpg",
    url: "/backgrounds/minimalist-studio.jpg",
  },
  {
    id: "cozy-room",
    label: "Cozy Room",
    preview: "/backgrounds/cozy-room.jpg",
    url: "/backgrounds/cozy-room.jpg",
  },
];

const VirtualBackground: React.FC<VirtualBackgroundProps> = ({ onClose, isOpen, videoTrack }) => {
  const hmsActions = useHMSActions();
  const [selectedBackground, setSelectedBackground] = useState<string>("none");
  const [isLoading, setIsLoading] = useState(false);
  const [isPluginLoaded, setIsPluginLoaded] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pluginRef = useRef<any>(null);

  // Load the virtual background plugin
  useEffect(() => {
    const loadPlugin = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const vbModule = await import("@100mslive/hms-virtual-background");
        HMSVirtualBackgroundPlugin = vbModule.HMSVirtualBackgroundPlugin;
        setIsPluginLoaded(true);
      } catch (err) {
        console.error("Failed to load virtual background plugin:", err);
        setError("Virtual backgrounds not supported in this browser");
      }
    };

    if (isOpen && !HMSVirtualBackgroundPlugin) {
      loadPlugin();
    }
  }, [isOpen]);

  // Apply background effect
  const applyBackground = useCallback(
    async (option: BackgroundOption | { type: "image"; url: string }) => {
      if (!HMSVirtualBackgroundPlugin || !videoTrack) {
        setError("Video not available");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Create plugin instance if not exists
        if (!pluginRef.current) {
          pluginRef.current = new HMSVirtualBackgroundPlugin("blur");
        }

        const plugin = pluginRef.current;

        if (option.type === "none") {
          // Remove virtual background
          await hmsActions.removePluginFromVideoTrack(plugin);
          setSelectedBackground("none");
        } else if (option.type === "blur") {
          // Apply blur effect
          const blurAmount = (option as BackgroundOption).blurAmount || 0.75;
          plugin.setBackground({
            backgroundType: "blur",
            blurPower: blurAmount,
          });
          await hmsActions.addPluginToVideoTrack(plugin);
          setSelectedBackground((option as BackgroundOption).id);
        } else if (option.type === "image") {
          // Apply image background
          const imageUrl = (option as { type: "image"; url: string }).url;

          // Load image first
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageUrl;
          });

          plugin.setBackground({
            backgroundType: "image",
            backgroundImage: img,
          });
          await hmsActions.addPluginToVideoTrack(plugin);
          setSelectedBackground(imageUrl);
        }
      } catch (err) {
        console.error("Failed to apply background:", err);
        setError("Failed to apply background. Try a different option.");
      } finally {
        setIsLoading(false);
      }
    },
    [hmsActions, videoTrack]
  );

  // Handle custom image upload
  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }

      setIsLoading(true);

      try {
        // Convert to data URL
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setCustomImage(dataUrl);
        await applyBackground({ type: "image", url: dataUrl });
      } catch (err) {
        console.error("Failed to upload image:", err);
        setError("Failed to process image");
      } finally {
        setIsLoading(false);
      }
    },
    [applyBackground]
  );

  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm duration-200">
      <div className="bg-bkg-dark-secondary animate-in zoom-in-95 mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 p-6 shadow-2xl duration-200">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-content-light text-xl font-bold">Virtual Background</h2>
            <p className="text-content-muted mt-1 text-sm">Choose a background for your video</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close virtual background settings"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
          >
            <i className="gng-close text-content-light" aria-hidden="true" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-danger/20 border-danger/30 text-danger mb-4 rounded-xl border p-3 text-sm">
            {error}
          </div>
        )}

        {/* Loading state for plugin */}
        {!isPluginLoaded && !error && (
          <div className="flex items-center justify-center py-8">
            <div className="border-action h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-content-muted ml-3">Loading...</span>
          </div>
        )}

        {isPluginLoaded && (
          <>
            {/* Blur options */}
            <div className="mb-6">
              <h3 className="text-content-muted mb-3 text-sm font-medium">Blur</h3>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_BACKGROUNDS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => applyBackground(option)}
                    disabled={isLoading}
                    className={cn(
                      "relative aspect-video overflow-hidden rounded-xl border-2 transition-all",
                      "transform hover:scale-105",
                      selectedBackground === option.id
                        ? "border-action ring-action/30 ring-2"
                        : "border-white/10 hover:border-white/30",
                      isLoading && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-center",
                        option.type === "none"
                          ? "bg-bkg-dark"
                          : "from-action/30 to-action/10 bg-gradient-to-br"
                      )}
                    >
                      {option.type === "none" ? (
                        <i className="gng-close text-content-muted" />
                      ) : (
                        <div
                          className="h-full w-full"
                          style={{
                            backdropFilter: `blur(${(option.blurAmount || 0.5) * 10}px)`,
                          }}
                        />
                      )}
                    </div>
                    <span className="text-content-light absolute right-0 bottom-1 left-0 text-center text-xs font-medium">
                      {option.label}
                    </span>
                    {selectedBackground === option.id && (
                      <div className="bg-action absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full">
                        <i className="gng-check text-xs text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Image backgrounds */}
            <div className="mb-6">
              <h3 className="text-content-muted mb-3 text-sm font-medium">Backgrounds</h3>
              <div className="grid grid-cols-3 gap-2">
                {BACKGROUND_IMAGES.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => applyBackground({ type: "image", url: bg.url })}
                    disabled={isLoading}
                    className={cn(
                      "relative aspect-video overflow-hidden rounded-xl border-2 transition-all",
                      "transform hover:scale-105",
                      selectedBackground === bg.url
                        ? "border-action ring-action/30 ring-2"
                        : "border-white/10 hover:border-white/30",
                      isLoading && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {/* Placeholder gradient for demo */}
                    <div
                      className={cn(
                        "absolute inset-0",
                        bg.id === "zen-garden" &&
                          "bg-gradient-to-br from-green-600/50 to-green-900/50",
                        bg.id === "mountain-sunrise" &&
                          "bg-gradient-to-br from-orange-500/50 to-purple-700/50",
                        bg.id === "peaceful-lake" &&
                          "bg-gradient-to-br from-blue-400/50 to-blue-800/50",
                        bg.id === "forest-path" &&
                          "bg-gradient-to-br from-green-700/50 to-green-950/50",
                        bg.id === "minimalist-studio" &&
                          "bg-gradient-to-br from-gray-400/50 to-gray-700/50",
                        bg.id === "cozy-room" &&
                          "bg-gradient-to-br from-amber-600/50 to-amber-900/50"
                      )}
                    />
                    <span className="absolute right-0 bottom-1 left-0 text-center text-xs font-medium text-white drop-shadow-lg">
                      {bg.label}
                    </span>
                    {selectedBackground === bg.url && (
                      <div className="bg-action absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full">
                        <i className="gng-check text-xs text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom upload */}
            <div>
              <h3 className="text-content-muted mb-3 text-sm font-medium">Custom</h3>
              <div className="flex gap-2">
                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className={cn(
                    "flex-1 rounded-xl border-2 border-dashed border-white/20 px-4 py-3",
                    "hover:border-action/50 hover:bg-action/10 transition-all",
                    "flex items-center justify-center gap-2",
                    isLoading && "cursor-not-allowed opacity-50"
                  )}
                >
                  <i className="gng-upload text-content-muted" />
                  <span className="text-content-muted text-sm">Upload Image</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Custom image preview */}
                {customImage && (
                  <button
                    onClick={() => applyBackground({ type: "image", url: customImage })}
                    disabled={isLoading}
                    className={cn(
                      "h-14 w-20 overflow-hidden rounded-xl border-2 transition-all",
                      selectedBackground === customImage
                        ? "border-action ring-action/30 ring-2"
                        : "border-white/10"
                    )}
                  >
                    <img
                      src={customImage}
                      alt="Custom background"
                      className="h-full w-full object-cover"
                    />
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/50">
            <div className="flex flex-col items-center">
              <div className="border-action h-10 w-10 animate-spin rounded-full border-3 border-t-transparent" />
              <span className="text-content-light mt-3 text-sm">Applying...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualBackground;

"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

import { cn } from "@lib/utils/style";

import VirtualBackground from "./VirtualBackground";

interface PreCallCheckProps {
  onReady: () => void;
  onCancel: () => void;
  userName: string;
}

interface DeviceInfo {
  deviceId: string;
  label: string;
}

const PreCallCheck: React.FC<PreCallCheckProps> = ({ onReady, onCancel, userName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [videoDevices, setVideoDevices] = useState<DeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<DeviceInfo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [selectedAudio, setSelectedAudio] = useState<string>("");

  const [hasVideoPermission, setHasVideoPermission] = useState<boolean | null>(null);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showVirtualBackground, setShowVirtualBackground] = useState(false);

  // Get available devices
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const videos = devices
        .filter((d) => d.kind === "videoinput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 4)}`,
        }));

      const audios = devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 4)}`,
        }));

      setVideoDevices(videos);
      setAudioDevices(audios);

      if (videos.length > 0 && !selectedVideo) {
        setSelectedVideo(videos[0].deviceId);
      }
      if (audios.length > 0 && !selectedAudio) {
        setSelectedAudio(audios[0].deviceId);
      }
    } catch (err) {
      console.error("Failed to enumerate devices:", err);
    }
  }, [selectedVideo, selectedAudio]);

  // Start media stream
  const startStream = useCallback(async () => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: selectedVideo ? { deviceId: { exact: selectedVideo } } : true,
        audio: selectedAudio ? { deviceId: { exact: selectedAudio } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Set video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasVideoPermission(true);
      }

      // Set up audio level meter
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        setHasAudioPermission(true);
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        // Start monitoring audio level
        const checkAudioLevel = () => {
          if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(Math.min(100, average * 1.5));
          }
          requestAnimationFrame(checkAudioLevel);
        };
        checkAudioLevel();
      }

      setIsLoading(false);
    } catch (err: unknown) {
      console.error("Failed to get media:", err);
      const error = err as { name?: string };
      if (error.name === "NotAllowedError") {
        setHasVideoPermission(false);
        setHasAudioPermission(false);
      }
      setIsLoading(false);
    }
  }, [selectedVideo, selectedAudio]);

  // Initialize
  useEffect(() => {
    getDevices();
    startStream();

    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [getDevices, startStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Handle join
  const handleJoin = useCallback(() => {
    // Stop preview stream before joining
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    onReady();
  }, [onReady]);

  return (
    <div className="bg-bkg-dark flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-content-light mb-2 text-2xl font-bold">Ready to join?</h1>
          <p className="text-content-muted">Check your camera and microphone before joining</p>
        </div>

        {/* Video Preview */}
        <div className="bg-bkg-dark-secondary mb-6 overflow-hidden rounded-2xl">
          <div className="relative aspect-video bg-black">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-action h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
              </div>
            ) : hasVideoPermission === false ? (
              <div className="text-content-muted absolute inset-0 flex flex-col items-center justify-center">
                <i className="gng-video-off mb-2 text-4xl" />
                <p>Camera permission denied</p>
              </div>
            ) : !isVideoEnabled ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="bg-action/20 mb-4 flex h-24 w-24 items-center justify-center rounded-full">
                  <span className="text-action text-4xl font-bold">
                    {userName?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
                <p className="text-content-muted">Camera is off</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full scale-x-[-1] transform object-cover"
              />
            )}

            {/* Name badge */}
            <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
              <span className="text-sm font-medium text-white">{userName}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 p-4">
            <button
              onClick={toggleAudio}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full transition-all",
                isAudioEnabled ? "bg-bkg-dark hover:bg-bkg-dark/80" : "bg-danger hover:bg-danger/80"
              )}
            >
              <i className={cn("text-xl text-white", isAudioEnabled ? "gng-mic" : "gng-mic-off")} />
            </button>

            <button
              onClick={toggleVideo}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full transition-all",
                isVideoEnabled ? "bg-bkg-dark hover:bg-bkg-dark/80" : "bg-danger hover:bg-danger/80"
              )}
            >
              <i
                className={cn("text-xl text-white", isVideoEnabled ? "gng-video" : "gng-video-off")}
              />
            </button>

            {/* Virtual Background Button */}
            <button
              onClick={() => setShowVirtualBackground(true)}
              className="bg-bkg-dark hover:bg-bkg-dark/80 flex h-14 w-14 items-center justify-center rounded-full transition-all"
              title="Virtual Background"
            >
              <i className="gng-image text-xl text-white" />
            </button>
          </div>
        </div>

        {/* Virtual Background Modal */}
        <VirtualBackground
          isOpen={showVirtualBackground}
          onClose={() => setShowVirtualBackground(false)}
          videoTrack={streamRef.current?.getVideoTracks()[0] || null}
        />

        {/* Audio Level Meter */}
        {hasAudioPermission && (
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-3">
              <i className="gng-mic text-content-muted" />
              <span className="text-content-muted text-sm">Microphone</span>
            </div>
            <div className="bg-bkg-dark-secondary h-2 overflow-hidden rounded-full">
              <div
                className="from-success to-action h-full bg-gradient-to-r transition-all duration-75"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
            <p className="text-content-muted mt-1 text-xs">
              {audioLevel > 10 ? "Microphone is working" : "Speak to test your microphone"}
            </p>
          </div>
        )}

        {/* Device Selection */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div>
            <label className="text-content-muted mb-2 block text-sm">Camera</label>
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              className="bg-bkg-dark-secondary text-content-light focus:border-action w-full rounded-xl border border-white/10 px-4 py-3 focus:outline-none"
            >
              {videoDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-content-muted mb-2 block text-sm">Microphone</label>
            <select
              value={selectedAudio}
              onChange={(e) => setSelectedAudio(e.target.value)}
              className="bg-bkg-dark-secondary text-content-light focus:border-action w-full rounded-xl border border-white/10 px-4 py-3 focus:outline-none"
            >
              {audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onCancel}
            className="text-content-light px-8 py-3 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={isLoading}
            className="bg-action hover:bg-action/90 rounded-xl px-8 py-3 font-medium text-white transition-colors disabled:opacity-50"
          >
            Join Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreCallCheck;

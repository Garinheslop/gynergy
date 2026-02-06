// Bunny Stream Video Hosting Service
// Provides video upload, streaming, and management functionality
// Documentation: https://docs.bunny.net/docs/stream-api-quick-start

const BUNNY_API_KEY = process.env.BUNNY_STREAM_API_KEY;
const BUNNY_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
const BUNNY_CDN_HOST = process.env.BUNNY_STREAM_CDN_HOSTNAME;

const BUNNY_API_BASE = "https://video.bunnycdn.com";

// =============================================================================
// TYPES
// =============================================================================

export interface BunnyVideo {
  guid: string;
  title: string;
  dateUploaded: string;
  status: number; // 0 = created, 1 = uploaded, 2 = processing, 3 = transcoding, 4 = finished, 5 = error, 6 = deleted
  views: number;
  length: number; // Duration in seconds
  width: number;
  height: number;
  averageWatchTime: number;
  totalWatchTime: number;
  thumbnailCount: number;
  encodeProgress: number;
  storageSize: number;
  framerate: number;
  hasMP4Fallback: boolean;
  availableResolutions: string;
}

export interface BunnyVideoCreateResponse {
  guid: string;
  title: string;
  libraryId: number;
  status: number;
}

export interface BunnyVideoListResponse {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  items: BunnyVideo[];
}

export type VideoStatus = "processing" | "ready" | "error" | "uploading";

// =============================================================================
// CONFIGURATION CHECK
// =============================================================================

export function isBunnyConfigured(): boolean {
  return !!(BUNNY_API_KEY && BUNNY_LIBRARY_ID);
}

export function getBunnyCDNHost(): string {
  return BUNNY_CDN_HOST || "";
}

// =============================================================================
// VIDEO MANAGEMENT
// =============================================================================

/**
 * Create a video placeholder in Bunny Stream
 * Returns the video ID for subsequent upload
 */
export async function createVideo(title: string): Promise<{ videoId: string }> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Stream not configured");
  }

  const response = await fetch(`${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos`, {
    method: "POST",
    headers: {
      AccessKey: BUNNY_API_KEY!,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create video: ${error}`);
  }

  const video: BunnyVideoCreateResponse = await response.json();
  return { videoId: video.guid };
}

/**
 * Upload video file to Bunny Stream
 * Uses PUT request with binary body
 */
export async function uploadVideo(
  videoId: string,
  fileBuffer: Buffer | ArrayBuffer
): Promise<void> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Stream not configured");
  }

  const response = await fetch(`${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_API_KEY!,
      "Content-Type": "application/octet-stream",
    },
    body: fileBuffer as unknown as BodyInit,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload video: ${error}`);
  }
}

/**
 * Upload video from URL (Bunny will fetch and process)
 * Useful for large files or when video is already hosted elsewhere
 */
export async function uploadVideoFromUrl(videoId: string, sourceUrl: string): Promise<void> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Stream not configured");
  }

  const response = await fetch(
    `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}/fetch`,
    {
      method: "POST",
      headers: {
        AccessKey: BUNNY_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: sourceUrl }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch video from URL: ${error}`);
  }
}

/**
 * Get video details from Bunny Stream
 */
export async function getVideo(videoId: string): Promise<BunnyVideo> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Stream not configured");
  }

  const response = await fetch(`${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
    headers: {
      AccessKey: BUNNY_API_KEY!,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get video: ${error}`);
  }

  return response.json();
}

/**
 * List videos in the library with pagination
 */
export async function listVideos(options?: {
  page?: number;
  itemsPerPage?: number;
  search?: string;
  orderBy?: "date" | "title";
}): Promise<BunnyVideoListResponse> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Stream not configured");
  }

  const params = new URLSearchParams();
  if (options?.page) params.set("page", options.page.toString());
  if (options?.itemsPerPage) params.set("itemsPerPage", options.itemsPerPage.toString());
  if (options?.search) params.set("search", options.search);
  if (options?.orderBy) params.set("orderBy", options.orderBy);

  const response = await fetch(`${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos?${params}`, {
    headers: {
      AccessKey: BUNNY_API_KEY!,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list videos: ${error}`);
  }

  return response.json();
}

/**
 * Update video metadata
 */
export async function updateVideo(videoId: string, updates: { title?: string }): Promise<void> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Stream not configured");
  }

  const response = await fetch(`${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
    method: "POST",
    headers: {
      AccessKey: BUNNY_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update video: ${error}`);
  }
}

/**
 * Delete video from Bunny Stream
 */
export async function deleteVideo(videoId: string): Promise<void> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Stream not configured");
  }

  const response = await fetch(`${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
    method: "DELETE",
    headers: {
      AccessKey: BUNNY_API_KEY!,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete video: ${error}`);
  }
}

// =============================================================================
// URL GENERATION
// =============================================================================

/**
 * Get HLS streaming URL for a video
 * This is the main URL for playback
 */
export function getStreamUrl(videoId: string): string {
  if (!BUNNY_CDN_HOST) {
    throw new Error("Bunny CDN hostname not configured");
  }
  return `https://${BUNNY_CDN_HOST}/${videoId}/playlist.m3u8`;
}

/**
 * Get MP4 fallback URL (for browsers without HLS support)
 */
export function getMp4Url(videoId: string, resolution?: string): string {
  if (!BUNNY_CDN_HOST) {
    throw new Error("Bunny CDN hostname not configured");
  }
  const res = resolution || "720";
  return `https://${BUNNY_CDN_HOST}/${videoId}/play_${res}p.mp4`;
}

/**
 * Get video thumbnail URL
 */
export function getThumbnailUrl(videoId: string): string {
  if (!BUNNY_CDN_HOST) {
    throw new Error("Bunny CDN hostname not configured");
  }
  return `https://${BUNNY_CDN_HOST}/${videoId}/thumbnail.jpg`;
}

/**
 * Get animated preview/GIF URL
 */
export function getPreviewUrl(videoId: string): string {
  if (!BUNNY_CDN_HOST) {
    throw new Error("Bunny CDN hostname not configured");
  }
  return `https://${BUNNY_CDN_HOST}/${videoId}/preview.webp`;
}

/**
 * Get thumbnail at specific time offset
 */
export function getThumbnailAtTime(videoId: string, seconds: number): string {
  if (!BUNNY_CDN_HOST) {
    throw new Error("Bunny CDN hostname not configured");
  }
  return `https://${BUNNY_CDN_HOST}/${videoId}/thumbnail_${seconds}.jpg`;
}

// =============================================================================
// STATUS HELPERS
// =============================================================================

/**
 * Map Bunny status code to our status type
 */
export function mapBunnyStatus(bunnyStatus: number): VideoStatus {
  switch (bunnyStatus) {
    case 0:
      return "uploading"; // Created, awaiting upload
    case 1:
      return "uploading"; // Uploaded, awaiting processing
    case 2:
      return "processing"; // Processing
    case 3:
      return "processing"; // Transcoding
    case 4:
      return "ready"; // Finished/ready
    case 5:
      return "error"; // Error
    case 6:
      return "error"; // Deleted
    default:
      return "processing";
  }
}

/**
 * Get video status with human-readable message
 */
export async function getVideoStatus(
  videoId: string
): Promise<{ status: VideoStatus; progress: number; message: string }> {
  const video = await getVideo(videoId);
  const status = mapBunnyStatus(video.status);

  let message: string;
  switch (video.status) {
    case 0:
      message = "Awaiting upload";
      break;
    case 1:
      message = "Upload complete, preparing for processing";
      break;
    case 2:
      message = "Processing video";
      break;
    case 3:
      message = `Transcoding (${video.encodeProgress}%)`;
      break;
    case 4:
      message = "Ready for playback";
      break;
    case 5:
      message = "Processing failed";
      break;
    case 6:
      message = "Video deleted";
      break;
    default:
      message = "Unknown status";
  }

  return {
    status,
    progress: video.encodeProgress,
    message,
  };
}

/**
 * Poll video status until ready or error
 * Useful for upload flows
 */
export async function waitForVideoReady(
  videoId: string,
  options?: {
    maxAttempts?: number;
    intervalMs?: number;
    onProgress?: (progress: number, message: string) => void;
  }
): Promise<{ ready: boolean; video?: BunnyVideo; error?: string }> {
  const maxAttempts = options?.maxAttempts || 60; // 5 minutes with 5s interval
  const intervalMs = options?.intervalMs || 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const video = await getVideo(videoId);
      const status = mapBunnyStatus(video.status);

      options?.onProgress?.(video.encodeProgress, `Processing: ${video.encodeProgress}%`);

      if (status === "ready") {
        return { ready: true, video };
      }

      if (status === "error") {
        return { ready: false, error: "Video processing failed" };
      }

      // Wait before next check
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    } catch (error) {
      return {
        ready: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  return { ready: false, error: "Timeout waiting for video to process" };
}

// =============================================================================
// CAPTIONS/SUBTITLES (Future feature)
// =============================================================================

/**
 * Upload captions/subtitles for a video
 */
export async function uploadCaptions(
  videoId: string,
  srclang: string,
  label: string,
  captionsContent: string
): Promise<void> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Stream not configured");
  }

  const response = await fetch(
    `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}/captions/${srclang}`,
    {
      method: "POST",
      headers: {
        AccessKey: BUNNY_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        srclang,
        label,
        captionsFile: Buffer.from(captionsContent).toString("base64"),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload captions: ${error}`);
  }
}

/**
 * Delete captions for a video
 */
export async function deleteCaptions(videoId: string, srclang: string): Promise<void> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Stream not configured");
  }

  const response = await fetch(
    `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}/captions/${srclang}`,
    {
      method: "DELETE",
      headers: {
        AccessKey: BUNNY_API_KEY!,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete captions: ${error}`);
  }
}

/**
 * Image Utility Tests
 * Tests for lib/utils/image.ts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Image Utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("getImageUrl", () => {
    it("constructs URL with API base and file path", async () => {
      process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

      const { getImageUrl } = await import("@lib/utils/image");

      const result = getImageUrl("uploads/profile/user-123.jpg");

      expect(result).toBe(
        "https://api.example.com/images/image-file?filePath=uploads/profile/user-123.jpg"
      );
    });

    it("handles different API URLs", async () => {
      process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000";

      // Need to reset module cache to pick up new env
      vi.resetModules();
      const { getImageUrl } = await import("@lib/utils/image");

      const result = getImageUrl("test/image.png");

      expect(result).toBe("http://localhost:3000/images/image-file?filePath=test/image.png");
    });

    it("handles empty file path", async () => {
      process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

      vi.resetModules();
      const { getImageUrl } = await import("@lib/utils/image");

      const result = getImageUrl("");

      expect(result).toBe("https://api.example.com/images/image-file?filePath=");
    });

    it("handles file paths with special characters", async () => {
      process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

      vi.resetModules();
      const { getImageUrl } = await import("@lib/utils/image");

      const result = getImageUrl("uploads/profile/user name.jpg");

      expect(result).toBe(
        "https://api.example.com/images/image-file?filePath=uploads/profile/user name.jpg"
      );
    });

    it("handles file paths with slashes", async () => {
      process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

      vi.resetModules();
      const { getImageUrl } = await import("@lib/utils/image");

      const result = getImageUrl("bucket/folder/subfolder/image.jpg");

      expect(result).toBe(
        "https://api.example.com/images/image-file?filePath=bucket/folder/subfolder/image.jpg"
      );
    });
  });

  describe("getBase64", () => {
    it("resolves with base64 string when file is read successfully", async () => {
      // Mock FileReader
      const mockResult = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD";
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: mockResult,
        onload: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((ev: ProgressEvent<FileReader>) => void) | null,
      };

      vi.stubGlobal(
        "FileReader",
        vi.fn(() => mockFileReader)
      );

      const { getBase64 } = await import("@lib/utils/image");

      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      const promise = getBase64(mockFile);

      // Trigger onload
      mockFileReader.onload?.({} as ProgressEvent<FileReader>);

      const result = await promise;

      expect(result).toBe(mockResult);
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
    });

    it("rejects when FileReader fails", async () => {
      const mockError = new Error("Read failed");
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: null,
        onload: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((ev: ProgressEvent<FileReader>) => void) | null,
      };

      vi.stubGlobal(
        "FileReader",
        vi.fn(() => mockFileReader)
      );

      vi.resetModules();
      const { getBase64 } = await import("@lib/utils/image");

      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      const promise = getBase64(mockFile);

      // Trigger onerror
      mockFileReader.onerror?.(mockError as unknown as ProgressEvent<FileReader>);

      await expect(promise).rejects.toEqual(mockError);
    });

    it("rejects when result is null", async () => {
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: null,
        onload: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((ev: ProgressEvent<FileReader>) => void) | null,
      };

      vi.stubGlobal(
        "FileReader",
        vi.fn(() => mockFileReader)
      );

      vi.resetModules();
      const { getBase64 } = await import("@lib/utils/image");

      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      const promise = getBase64(mockFile);

      // Trigger onload with null result
      mockFileReader.onload?.({} as ProgressEvent<FileReader>);

      await expect(promise).rejects.toThrow("File reading failed");
    });
  });

  describe("base64ToArrayBuffer", () => {
    beforeEach(() => {
      // Mock window.atob
      vi.stubGlobal("window", {
        atob: (str: string) => Buffer.from(str, "base64").toString("binary"),
      });
    });

    it("extracts content type from data URL", async () => {
      vi.resetModules();
      const { base64ToArrayBuffer } = await import("@lib/utils/image");

      const base64 = "data:image/png;base64,iVBORw0KGgo=";

      const result = base64ToArrayBuffer(base64);

      expect(result.contentType).toBe("image/png");
    });

    it("returns file buffer", async () => {
      vi.resetModules();
      const { base64ToArrayBuffer } = await import("@lib/utils/image");

      const base64 = "data:image/jpeg;base64,/9j/4AAQ";

      const result = base64ToArrayBuffer(base64);

      expect(result.file).toBeInstanceOf(Buffer);
      expect(result.file.length).toBeGreaterThan(0);
    });

    it("creates blob file with correct type", async () => {
      vi.resetModules();
      const { base64ToArrayBuffer } = await import("@lib/utils/image");

      const base64 = "data:image/gif;base64,R0lGODlh";

      const result = base64ToArrayBuffer(base64);

      expect(result.blobFile).toBeInstanceOf(File);
      expect(result.blobFile.type).toBe("image/gif");
    });

    it("handles base64 without data URL prefix", async () => {
      vi.resetModules();
      const { base64ToArrayBuffer } = await import("@lib/utils/image");

      // Just the base64 part after the comma
      const base64 = ",iVBORw0KGgo=";

      const result = base64ToArrayBuffer(base64);

      // Should default to image/jpeg when no content type detected
      expect(result.contentType).toBeNull();
    });

    it("generates timestamped filename", async () => {
      vi.resetModules();
      const { base64ToArrayBuffer } = await import("@lib/utils/image");

      const before = Date.now();
      const base64 = "data:image/jpeg;base64,/9j/4AAQ";

      const result = base64ToArrayBuffer(base64);
      const after = Date.now();

      // Extract timestamp from filename (e.g., "1234567890.jpg")
      const filename = result.blobFile.name;
      const timestamp = parseInt(filename.split(".")[0]);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
      expect(filename).toMatch(/^\d+\.jpg$/);
    });

    it("handles different image types", async () => {
      vi.resetModules();
      const { base64ToArrayBuffer } = await import("@lib/utils/image");

      const pngBase64 = "data:image/png;base64,iVBORw0KGgo=";
      const jpegBase64 = "data:image/jpeg;base64,/9j/4AAQ";
      const webpBase64 = "data:image/webp;base64,UklGRg==";

      expect(base64ToArrayBuffer(pngBase64).contentType).toBe("image/png");
      expect(base64ToArrayBuffer(jpegBase64).contentType).toBe("image/jpeg");
      expect(base64ToArrayBuffer(webpBase64).contentType).toBe("image/webp");
    });
  });
});

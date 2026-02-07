"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseClipboardOptions {
  /** Duration in ms to show success state */
  successDuration?: number;
  /** Callback on successful copy */
  onSuccess?: (text: string) => void;
  /** Callback on copy error */
  onError?: (error: Error) => void;
}

interface UseClipboardReturn {
  /** Copy text to clipboard */
  copy: (text: string) => Promise<boolean>;
  /** Whether copy was successful (resets after successDuration) */
  copied: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Whether clipboard API is supported */
  isSupported: boolean;
  /** Reset the copied state */
  reset: () => void;
}

/**
 * Hook for copying text to clipboard with feedback
 *
 * @example
 * ```tsx
 * function ShareButton({ url }) {
 *   const { copy, copied, error } = useClipboard();
 *
 *   return (
 *     <button onClick={() => copy(url)}>
 *       {copied ? 'Copied!' : 'Copy Link'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { successDuration = 2000, onSuccess, onError } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if clipboard API is supported
  const isSupported =
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard !== "undefined" &&
    typeof navigator.clipboard.writeText === "function";

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      // Clear previous state
      setError(null);
      setCopied(false);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      try {
        if (isSupported) {
          // Modern clipboard API
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          const successful = document.execCommand("copy");
          document.body.removeChild(textArea);

          if (!successful) {
            throw new Error("Failed to copy text using execCommand");
          }
        }

        setCopied(true);
        onSuccess?.(text);

        // Reset copied state after duration
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, successDuration);

        return true;
      } catch (err) {
        const copyError = err instanceof Error ? err : new Error("Failed to copy to clipboard");
        setError(copyError);
        onError?.(copyError);
        return false;
      }
    },
    [isSupported, successDuration, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { copy, copied, error, isSupported, reset };
}

/**
 * Hook for reading from clipboard
 *
 * @example
 * ```tsx
 * function PasteButton({ onPaste }) {
 *   const { read, text, isSupported } = useClipboardRead();
 *
 *   const handlePaste = async () => {
 *     const result = await read();
 *     if (result) onPaste(result);
 *   };
 *
 *   if (!isSupported) return null;
 *
 *   return <button onClick={handlePaste}>Paste</button>;
 * }
 * ```
 */
export function useClipboardRead(): {
  read: () => Promise<string | null>;
  text: string | null;
  error: Error | null;
  isSupported: boolean;
} {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const isSupported =
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard !== "undefined" &&
    typeof navigator.clipboard.readText === "function";

  const read = useCallback(async (): Promise<string | null> => {
    setError(null);

    try {
      if (!isSupported) {
        throw new Error("Clipboard read is not supported in this browser");
      }

      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
      return clipboardText;
    } catch (err) {
      const readError = err instanceof Error ? err : new Error("Failed to read clipboard");
      setError(readError);
      return null;
    }
  }, [isSupported]);

  return { read, text, error, isSupported };
}

/**
 * Copy button component hook with all states
 */
export function useCopyButton(options: UseClipboardOptions = {}) {
  const clipboard = useClipboard(options);

  const getButtonProps = useCallback(
    (text: string) => ({
      onClick: () => clipboard.copy(text),
      "aria-label": clipboard.copied ? "Copied" : "Copy to clipboard",
      disabled: !clipboard.isSupported,
    }),
    [clipboard]
  );

  const getButtonText = useCallback(
    (defaultText = "Copy", copiedText = "Copied!") => {
      if (clipboard.error) return "Failed";
      return clipboard.copied ? copiedText : defaultText;
    },
    [clipboard.copied, clipboard.error]
  );

  return {
    ...clipboard,
    getButtonProps,
    getButtonText,
  };
}

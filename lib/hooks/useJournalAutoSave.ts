"use client";

import { useCallback, useEffect, useRef } from "react";

const STORAGE_PREFIX = "gynergy_journal_draft_";
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AutoSaveDraft<T> {
  data: T;
  savedAt: number;
  journalType: string;
  date: string;
}

interface UseJournalAutoSaveOptions<T> {
  /** Unique identifier for this journal (e.g., "morning_2024-01-15") */
  journalKey: string;
  /** Current editor data to auto-save */
  data: T | null;
  /** Whether the journal has already been submitted */
  isSubmitted?: boolean;
  /** Callback when draft is restored */
  onRestore?: (draft: T) => void;
}

/**
 * Hook to auto-save journal drafts to localStorage
 *
 * Features:
 * - Auto-saves every 30 seconds
 * - Restores draft on mount if available
 * - Clears draft after 24 hours
 * - Clears draft when journal is submitted
 * - Warns before navigation when unsaved changes exist
 */
export function useJournalAutoSave<T>({
  journalKey,
  data,
  isSubmitted = false,
  onRestore,
}: UseJournalAutoSaveOptions<T>) {
  const hasRestoredRef = useRef(false);
  const lastSavedRef = useRef<string>("");

  const storageKey = `${STORAGE_PREFIX}${journalKey}`;

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    if (!data || isSubmitted) return;

    const serialized = JSON.stringify(data);

    // Skip if data hasn't changed
    if (serialized === lastSavedRef.current) return;

    try {
      const draft: AutoSaveDraft<T> = {
        data,
        savedAt: Date.now(),
        journalType: journalKey.split("_")[0],
        date: journalKey.split("_")[1] || new Date().toISOString().split("T")[0],
      };

      localStorage.setItem(storageKey, JSON.stringify(draft));
      lastSavedRef.current = serialized;
    } catch (error) {
      console.warn("Failed to auto-save journal draft:", error);
    }
  }, [data, isSubmitted, storageKey, journalKey]);

  // Load draft from localStorage
  const loadDraft = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const draft: AutoSaveDraft<T> = JSON.parse(stored);

      // Check if draft has expired
      if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return draft.data;
    } catch (error) {
      console.warn("Failed to load journal draft:", error);
      return null;
    }
  }, [storageKey]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      lastSavedRef.current = "";
    } catch (error) {
      console.warn("Failed to clear journal draft:", error);
    }
  }, [storageKey]);

  // Check if there's a saved draft
  const hasDraft = useCallback((): boolean => {
    try {
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  }, [storageKey]);

  // Restore draft on mount
  useEffect(() => {
    if (hasRestoredRef.current || isSubmitted) return;

    const draft = loadDraft();
    if (draft && onRestore) {
      onRestore(draft);
      hasRestoredRef.current = true;
    }
  }, [loadDraft, onRestore, isSubmitted]);

  // Auto-save interval
  useEffect(() => {
    if (isSubmitted) return;

    const interval = setInterval(saveDraft, AUTO_SAVE_INTERVAL);

    // Also save when component unmounts
    return () => {
      clearInterval(interval);
      saveDraft();
    };
  }, [saveDraft, isSubmitted]);

  // Clear draft when submitted
  useEffect(() => {
    if (isSubmitted) {
      clearDraft();
    }
  }, [isSubmitted, clearDraft]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (isSubmitted || !data) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only warn if there's data that differs from last saved
      const serialized = JSON.stringify(data);
      if (serialized !== lastSavedRef.current && serialized !== "null") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [data, isSubmitted]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
  };
}

/**
 * Get all saved journal drafts
 */
export function getAllJournalDrafts(): Array<{ key: string; draft: AutoSaveDraft<unknown> }> {
  const drafts: Array<{ key: string; draft: AutoSaveDraft<unknown> }> = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const draft = JSON.parse(stored) as AutoSaveDraft<unknown>;
          // Skip expired drafts
          if (Date.now() - draft.savedAt <= DRAFT_EXPIRY_MS) {
            drafts.push({ key: key.replace(STORAGE_PREFIX, ""), draft });
          } else {
            // Clean up expired draft
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (error) {
    console.warn("Failed to get journal drafts:", error);
  }

  return drafts;
}

/**
 * Clear all journal drafts
 */
export function clearAllJournalDrafts(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("Failed to clear journal drafts:", error);
  }
}

export default useJournalAutoSave;

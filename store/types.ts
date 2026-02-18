// =============================================================================
// CENTRALIZED REDUX TYPES
// =============================================================================
//
// Single import point for all Redux types. Slice state types are derived
// directly from RootState so they stay in sync automatically.
//
// Usage:
//   import type { RootState, AppDispatch, ProfileState } from "@store/types";

// -----------------------------------------------------------------------------
// Core types (re-exported from configureStore)
// -----------------------------------------------------------------------------

export type { RootState, AppDispatch, AppThunk, AppThunkDispatch } from "./configureStore";

// Re-export typed hooks for convenience
export { useDispatch, useSelector } from "./hooks";

// -----------------------------------------------------------------------------
// Slice state types (derived from RootState for automatic sync)
// -----------------------------------------------------------------------------

import type { RootState } from "./configureStore";

export type ActionState = RootState["actions"];
export type BookState = RootState["books"];
export type CommunityState = RootState["community"];
export type EnrollmentState = RootState["enrollments"];
export type EditorState = RootState["editor"];
export type VisionState = RootState["visions"];
export type GlobalState = RootState["global"];
export type JournalState = RootState["journals"];
export type HistoryState = RootState["histories"];
export type ProfileState = RootState["profile"];
export type QuoteState = RootState["quotes"];
export type LeaderboardState = RootState["leaderboard"];
export type MeditationState = RootState["meditations"];
export type GamificationState = RootState["gamification"];
export type AIState = RootState["ai"];
export type VideoState = RootState["video"];
export type PaymentState = RootState["payment"];

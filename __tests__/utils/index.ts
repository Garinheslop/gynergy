/**
 * Test Utilities - Main Export
 * Import all test utilities from this single location
 *
 * @example
 * import {
 *   renderWithProviders,
 *   mockUser,
 *   setupUserEvent,
 *   createAuthenticatedState,
 * } from "@tests/utils";
 */

// Test render utilities
export * from "./test-utils";

// Redux test utilities
export {
  createTestStore,
  ReduxTestWrapper,
  renderWithStore,
  createSliceState,
  mergeSliceStates,
  waitForStateChange,
  createStoreWithActionHistory,
  createMockDispatch,
  expectActionDispatched,
  expectActionNotDispatched,
} from "./redux-wrapper";

// Component test helpers
export {
  setupUserEvent,
  fillField,
  fillForm,
  clickButton,
  clickLink,
  selectOption,
  toggleCheckbox,
  submitForm,
  waitForFormSubmission,
  expectFocused,
  expectFormError,
  expectAccessibleName,
  checkAccessibility,
  getListItems,
  expectLoading,
  expectNotLoading,
  waitForLoadingComplete,
  expectError,
  expectSuccess,
  pressKey,
  pressTab,
  pressEnter,
  pressEscape,
  expectModalOpen,
  expectModalClosed,
  hoverElement,
  unhoverElement,
  expectTooltip,
  getTableRows,
  getTableCell,
} from "./component-helpers";

// Mock factories
export {
  mockUser,
  mockSupabaseUser,
  mockSession,
  mockBookSession,
  mockEnrollment,
  mockJournalEntry,
  mockBadge,
  mockUserBadge,
  mockReduxState,
  mockArray,
  mockApiResponse,
  resetIdCounter,
} from "../mocks/factories";

// Auth mocks
export {
  createAuthenticatedState,
  createUnauthenticatedState,
  createExpiredSessionState,
  mockUseSession,
  setupAuthMock,
  createAuthenticatedReduxState,
  createUnauthenticatedReduxState,
  mockAuthMiddleware,
  simulateLogin,
  simulateLogout,
  simulateSessionExpiry,
} from "../mocks/auth";

// Supabase mocks
export {
  createMockSupabaseClient,
  setupSupabaseMock,
  createMockServerSupabaseClient,
  setMockData,
  getMockData,
  resetMockDataStore,
} from "../mocks/supabase";

// Re-export commonly used testing library utilities
export { screen, within, waitFor, fireEvent } from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

// MSW utilities
export {
  server,
  stores as mswStores,
  setupMSW,
  addTestHandlers,
  simulateApiError,
  simulateNetworkError,
  simulateSlowResponse,
} from "../mocks/server";

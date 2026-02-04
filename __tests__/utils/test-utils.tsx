/**
 * Test Utilities
 * Provides renderWithProviders and other helpers for testing React components
 */
import React, { PropsWithChildren, ReactElement } from "react";

import { configureStore, EnhancedStore } from "@reduxjs/toolkit";
import { render, RenderOptions, RenderResult, waitFor, screen } from "@testing-library/react";
import { Provider } from "react-redux";

import { RootState } from "@store/configureStore";
import reducer from "@store/reducer";

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

/**
 * Options for renderWithProviders
 */
interface ExtendedRenderOptions extends Omit<RenderOptions, "queries"> {
  preloadedState?: Partial<RootState>;
  store?: EnhancedStore<RootState>;
}

/**
 * Create a test store with optional preloaded state
 * Note: This creates a non-persisted store for testing
 */
export function createTestStore(preloadedState?: Partial<RootState>): EnhancedStore<RootState> {
  return configureStore({
    reducer,
    preloadedState: preloadedState as RootState | undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
}

/**
 * Wrapper component that provides Redux store
 */
function createWrapper(store: EnhancedStore<RootState>) {
  return function Wrapper({ children }: PropsWithChildren<object>): ReactElement {
    return <Provider store={store}>{children}</Provider>;
  };
}

/**
 * Render a component with all necessary providers (Redux, etc.)
 *
 * @example
 * ```tsx
 * const { store } = renderWithProviders(<MyComponent />, {
 *   preloadedState: {
 *     profile: { current: mockUser }
 *   }
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
): RenderResult & { store: EnhancedStore<RootState> } {
  const result = render(ui, {
    wrapper: createWrapper(store),
    ...renderOptions,
  });

  return {
    store,
    ...result,
  };
}

/**
 * Wait for loading states to finish
 * Useful when components show loading spinners
 */
export async function waitForLoadingToFinish(): Promise<void> {
  await waitFor(
    () => {
      const loaders = [
        ...screen.queryAllByTestId("loader"),
        ...screen.queryAllByTestId("spinner"),
        ...screen.queryAllByRole("progressbar"),
        ...screen.queryAllByText(/loading/i),
      ];
      if (loaders.length > 0) {
        throw new Error("Still loading");
      }
    },
    { timeout: 5000 }
  );
}

/**
 * Wait for an element to be removed from the DOM
 */
export async function waitForElementToBeRemoved(callback: () => HTMLElement | null): Promise<void> {
  await waitFor(() => {
    const element = callback();
    if (element) {
      throw new Error("Element still present");
    }
  });
}

/**
 * Simulate a delay (useful for testing loading states)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert that a function throws an error
 */
export async function expectToThrow(
  fn: () => Promise<unknown>,
  errorMessage?: string | RegExp
): Promise<void> {
  let threw = false;
  try {
    await fn();
  } catch (error) {
    threw = true;
    if (errorMessage) {
      const message = error instanceof Error ? error.message : String(error);
      if (typeof errorMessage === "string") {
        expect(message).toContain(errorMessage);
      } else {
        expect(message).toMatch(errorMessage);
      }
    }
  }
  expect(threw).toBe(true);
}

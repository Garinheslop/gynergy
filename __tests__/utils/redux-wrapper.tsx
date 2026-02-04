/**
 * Redux Test Wrapper
 * Provides utilities for testing Redux-connected components
 */
import React, { PropsWithChildren, ReactElement } from "react";

import { configureStore, EnhancedStore, PreloadedState, Reducer } from "@reduxjs/toolkit";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { Provider } from "react-redux";

import { RootState } from "@store/configureStore";
import reducer from "@store/reducer";

/**
 * Options for renderWithStore
 */
interface RenderWithStoreOptions extends Omit<RenderOptions, "queries"> {
  preloadedState?: PreloadedState<RootState>;
  store?: EnhancedStore<RootState>;
  reducer?: Reducer<RootState>;
}

/**
 * Create a test store without redux-persist
 * This is essential for unit testing as redux-persist adds async behavior
 */
export function createTestStore(
  preloadedState?: PreloadedState<RootState>,
  customReducer?: Reducer<RootState>
): EnhancedStore<RootState> {
  return configureStore({
    reducer: customReducer || reducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        // Disable immutability checks for faster tests
        immutableCheck: false,
      }),
  });
}

/**
 * Redux Provider wrapper for testing
 */
export function ReduxTestWrapper({
  children,
  store,
}: PropsWithChildren<{ store: EnhancedStore<RootState> }>): ReactElement {
  return <Provider store={store}>{children}</Provider>;
}

/**
 * Render a component with Redux store
 *
 * @example
 * ```tsx
 * const { store, getByText } = renderWithStore(<MyComponent />, {
 *   preloadedState: {
 *     profile: {
 *       current: mockUser(),
 *       loading: false,
 *       error: "",
 *     }
 *   }
 * });
 *
 * // Dispatch actions and check state
 * store.dispatch(someAction());
 * expect(store.getState().someSlice.value).toBe(expected);
 * ```
 */
export function renderWithStore(
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: RenderWithStoreOptions = {}
): RenderResult & { store: EnhancedStore<RootState> } {
  function Wrapper({ children }: PropsWithChildren<object>): ReactElement {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Create initial state for specific slice
 * Useful for creating focused preloaded states
 */
export function createSliceState<K extends keyof RootState>(
  sliceName: K,
  state: Partial<RootState[K]>
): Partial<RootState> {
  // Get the initial state by creating a temporary store
  const tempStore = createTestStore();
  const initialState = tempStore.getState();

  return {
    [sliceName]: {
      ...initialState[sliceName],
      ...state,
    },
  } as Partial<RootState>;
}

/**
 * Merge multiple slice states into a preloaded state
 */
export function mergeSliceStates(...sliceStates: Partial<RootState>[]): Partial<RootState> {
  return sliceStates.reduce((acc, slice) => ({ ...acc, ...slice }), {});
}

/**
 * Wait for Redux state to match a condition
 */
export async function waitForStateChange(
  store: EnhancedStore<RootState>,
  predicate: (state: RootState) => boolean,
  timeout: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Check immediately
    if (predicate(store.getState())) {
      resolve();
      return;
    }

    // Subscribe to changes
    const unsubscribe = store.subscribe(() => {
      if (predicate(store.getState())) {
        unsubscribe();
        resolve();
      } else if (Date.now() - startTime > timeout) {
        unsubscribe();
        reject(new Error("Timeout waiting for state change"));
      }
    });

    // Timeout fallback
    setTimeout(() => {
      unsubscribe();
      reject(new Error("Timeout waiting for state change"));
    }, timeout);
  });
}

/**
 * Get action history from store (for testing purposes)
 * Note: This requires a custom middleware to track actions
 */
export function createStoreWithActionHistory(
  preloadedState?: PreloadedState<RootState>
): EnhancedStore<RootState> & { actionHistory: unknown[] } {
  const actionHistory: unknown[] = [];

  const actionTrackingMiddleware =
    () => (next: (action: unknown) => unknown) => (action: unknown) => {
      actionHistory.push(action);
      return next(action);
    };

  const store = configureStore({
    reducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }).concat(actionTrackingMiddleware),
  });

  return Object.assign(store, { actionHistory });
}

/**
 * Create a mock dispatch function that tracks calls
 */
export function createMockDispatch() {
  const dispatchedActions: unknown[] = [];

  const dispatch = (action: unknown) => {
    dispatchedActions.push(action);
    return action;
  };

  return {
    dispatch,
    getDispatchedActions: () => dispatchedActions,
    getLastAction: () => dispatchedActions[dispatchedActions.length - 1],
    clearActions: () => {
      dispatchedActions.length = 0;
    },
  };
}

/**
 * Assert that an action was dispatched
 */
export function expectActionDispatched(
  store: EnhancedStore<RootState> & { actionHistory?: unknown[] },
  actionType: string
): void {
  if (!store.actionHistory) {
    throw new Error("Store does not have action history. Use createStoreWithActionHistory.");
  }

  const wasDispatched = store.actionHistory.some(
    (action: unknown) => (action as { type: string }).type === actionType
  );

  if (!wasDispatched) {
    throw new Error(
      `Expected action "${actionType}" to be dispatched. ` +
        `Dispatched actions: ${store.actionHistory
          .map((a: unknown) => (a as { type: string }).type)
          .join(", ")}`
    );
  }
}

/**
 * Assert that an action was NOT dispatched
 */
export function expectActionNotDispatched(
  store: EnhancedStore<RootState> & { actionHistory?: unknown[] },
  actionType: string
): void {
  if (!store.actionHistory) {
    throw new Error("Store does not have action history. Use createStoreWithActionHistory.");
  }

  const wasDispatched = store.actionHistory.some(
    (action: unknown) => (action as { type: string }).type === actionType
  );

  if (wasDispatched) {
    throw new Error(`Expected action "${actionType}" NOT to be dispatched, but it was.`);
  }
}

"use client";

import React, { ReactNode, useEffect, useState } from "react";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

interface ReduxStoreProviderProps {
  children: ReactNode;
}

export const ReduxStoreProvider: React.FC<ReduxStoreProviderProps> = ({ children }) => {
  const [storeReady, setStoreReady] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [persistor, setPersistor] = useState<any>(null);

  useEffect(() => {
    // Dynamically import the store only on the client
    import("@store/configureStore").then((module) => {
      setStore(module.store);
      setPersistor(module.persistor);
      setStoreReady(true);
    });
  }, []);

  if (!storeReady || !store || !persistor) {
    // Return loading state while store initializes
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
};

export default ReduxStoreProvider;

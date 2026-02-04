"use client";

//components
import { Toaster } from "react-hot-toast";

import Popups from "@modules/common/components/modal/Popups";

const DefaultLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "rgb(32, 32, 32)",
            color: "rgb(220, 220, 220)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
          success: {
            iconTheme: {
              primary: "rgb(255, 200, 120)",
              secondary: "rgb(32, 32, 32)",
            },
          },
        }}
      />
      <Popups />
      {children}
    </>
  );
};

export default DefaultLayout;

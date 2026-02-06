import React, { ReactNode, useEffect } from "react";

import { Transition } from "react-transition-group";

import { cn } from "@lib/utils/style";

interface ModalProps {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
}

const Modal = ({ children, open, onClose }: ModalProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    if (!open) {
      document.body.style.overflow = "auto";
    }
  }, [open]);
  //handlers
  const closeModal = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.target instanceof HTMLElement && e.target.id === "close-modal") {
      onClose();
    }
  };

  return (
    <Transition in={open as any} mountOnEnter unmountOnExit timeout={1}>
      {(state: string) => {
        return (
          <div
            className={cn(
              `bg-bkg-dark/10 fixed top-0 left-0 z-[10000] h-screen w-screen backdrop-blur-[5px] backdrop-brightness-[100%] transition-all`,
              {
                "opacity-0": ["entering", "exiting", "exited"].includes(state),
                "opacity-100": state === "entered",
              }
            )}
            onClick={closeModal}
          >
            <div id="close-modal" className="flex h-full w-screen items-center justify-center">
              {children}
            </div>
          </div>
        );
      }}
    </Transition>
  );
};

export default Modal;

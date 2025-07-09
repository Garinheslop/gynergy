import { Transition } from "react-transition-group";
import { ReactNode, useEffect } from "react";
import { cn } from "@lib/utils/style";

interface ModalProps {
  children: ReactNode;
  open: Boolean;
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
              `fixed top-0 left-0 z-[10000] h-screen w-screen bg-bkg-dark/10 transition-all backdrop-blur-[5px] backdrop-brightness-[100%] `,
              {
                "opacity-0": ["entering", "exiting", "exited"].includes(state),
                "opacity-100": state === "entered",
              }
            )}
            onClick={closeModal}
          >
            <div id="close-modal" className="flex justify-center items-center w-screen h-full">
              {children}
            </div>
          </div>
        );
      }}
    </Transition>
  );
};

export default Modal;

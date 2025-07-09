import React, { FC, ReactNode } from "react";
import { Transition } from "react-transition-group";
import type { TransitionStatus } from "react-transition-group/Transition";
import { cn } from "@lib/utils/style";

interface TransitionWrapperProps {
  isOpen: boolean;
  children: ReactNode;
  timeout?: number;
  mountOnEnter?: boolean;
  unmountOnExit?: boolean;
  sx?: string;
}

const TransitionWrapper: FC<TransitionWrapperProps> = ({
  isOpen,
  children,
  timeout = 150,
  mountOnEnter = true,
  unmountOnExit = true,
  sx,
}) => {
  return (
    <Transition
      in={isOpen}
      mountOnEnter={mountOnEnter}
      unmountOnExit={unmountOnExit}
      timeout={timeout}
    >
      {(state: TransitionStatus) => (
        <section
          className={cn(
            "h-auto translate-y-[-10px] overflow-hidden rounded-md opacity-0 duration-150",
            { "translate-y-0 opacity-100": state === "entered" },
            sx
          )}
        >
          {children}
        </section>
      )}
    </Transition>
  );
};

export default TransitionWrapper;

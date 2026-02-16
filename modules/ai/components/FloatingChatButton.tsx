"use client";
import React, { useState } from "react";

import { useSelector } from "react-redux";

import { cn } from "@lib/utils/style";
import { RootState } from "@store/configureStore";

import CharacterAvatar from "./CharacterAvatar";
import ChatContainer from "./ChatContainer";

interface FloatingChatButtonProps {
  position?: "bottom-right" | "bottom-left";
  sx?: string;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
  position = "bottom-right",
  sx,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { activeCharacter } = useSelector((state: RootState) => state.ai);

  const positionClasses = {
    "bottom-right": "right-4 bottom-4",
    "bottom-left": "left-4 bottom-4",
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50",
            positionClasses[position],
            "h-[600px] max-h-[80vh] w-full max-w-md",
            "overflow-hidden rounded-2xl shadow-2xl",
            "border-border-light/20 border",
            // Mobile: full screen
            "sm:w-96"
          )}
          style={{
            // Adjust position to not overlap with button
            bottom: position.includes("bottom") ? "80px" : undefined,
          }}
        >
          <ChatContainer onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed z-50",
          positionClasses[position],
          "h-14 w-14 rounded-full",
          "flex items-center justify-center",
          "shadow-lg transition-all duration-300",
          isOpen ? "bg-bkg-light rotate-0" : "from-action to-action-secondary bg-gradient-to-br",
          "hover:scale-105 active:scale-95",
          sx
        )}
      >
        {isOpen ? (
          <i className="gng-close text-content-dark text-2xl" />
        ) : activeCharacter ? (
          <CharacterAvatar characterKey={activeCharacter} size="medium" />
        ) : (
          <i className="gng-chat text-2xl text-white" />
        )}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default FloatingChatButton;

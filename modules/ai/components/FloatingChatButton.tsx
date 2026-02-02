"use client";
import React, { useState } from "react";
import { cn } from "@lib/utils/style";
import { useSelector } from "react-redux";
import { RootState } from "@store/configureStore";
import ChatContainer from "./ChatContainer";
import CharacterAvatar from "./CharacterAvatar";

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
            "w-full max-w-md h-[600px] max-h-[80vh]",
            "rounded-2xl overflow-hidden shadow-2xl",
            "border border-border-light/20",
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
          "w-14 h-14 rounded-full",
          "flex items-center justify-center",
          "shadow-lg transition-all duration-300",
          isOpen
            ? "bg-bkg-light rotate-0"
            : "bg-gradient-to-br from-action to-action-secondary",
          "hover:scale-105 active:scale-95",
          sx
        )}
      >
        {isOpen ? (
          <i className="gng-close text-[24px] text-content-dark" />
        ) : activeCharacter ? (
          <CharacterAvatar characterKey={activeCharacter} size="medium" />
        ) : (
          <i className="gng-chat text-[24px] text-white" />
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

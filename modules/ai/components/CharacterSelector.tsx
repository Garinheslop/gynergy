"use client";
import React from "react";

import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { CharacterKey } from "@resources/types/ai";
import { paragraphVariants } from "@resources/variants";

import CharacterAvatar from "./CharacterAvatar";

interface CharacterOption {
  key: CharacterKey;
  name: string;
  role: string;
  description: string;
}

const characters: CharacterOption[] = [
  {
    key: "yesi",
    name: "Yesi",
    role: "Nurturing Coach",
    description: "Warm, empathetic guidance with emotional support",
  },
  {
    key: "garin",
    name: "Garin",
    role: "Strategic Coach",
    description: "Direct, action-oriented accountability partner",
  },
];

interface CharacterSelectorProps {
  selectedCharacter: CharacterKey | null;
  suggestedCharacter?: CharacterKey | null;
  onSelect: (characterKey: CharacterKey) => void;
  variant?: "cards" | "compact";
  sx?: string;
}

const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  selectedCharacter,
  suggestedCharacter,
  onSelect,
  variant = "cards",
  sx,
}) => {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", sx)}>
        {characters.map((char) => (
          <button
            key={char.key}
            onClick={() => onSelect(char.key)}
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-2 transition-all duration-200",
              selectedCharacter === char.key
                ? "bg-action/20 ring-action ring-2"
                : "bg-bkg-light hover:bg-bkg-light/80"
            )}
          >
            <CharacterAvatar
              characterKey={char.key}
              size="small"
              isActive={selectedCharacter === char.key}
            />
            <span
              className={cn(
                "text-sm font-medium",
                selectedCharacter === char.key ? "text-action" : "text-content-dark-secondary"
              )}
            >
              {char.name}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-4", sx)}>
      {characters.map((char) => {
        const isSelected = selectedCharacter === char.key;
        const isSuggested = suggestedCharacter === char.key;

        return (
          <button
            key={char.key}
            onClick={() => onSelect(char.key)}
            className={cn(
              "relative flex flex-col items-center rounded-xl p-4 transition-all duration-200",
              "border-2",
              isSelected
                ? "bg-action/10 border-action"
                : "bg-bkg-light hover:border-border-light border-transparent"
            )}
          >
            {isSuggested && !isSelected && (
              <span className="bg-action absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-xs text-white">
                Suggested
              </span>
            )}

            <CharacterAvatar characterKey={char.key} size="large" isActive={isSelected} />

            <Paragraph
              content={char.name}
              variant={paragraphVariants.regular}
              sx={cn("font-bold mt-3", isSelected ? "text-action" : "text-content-dark")}
            />

            <Paragraph
              content={char.role}
              variant={paragraphVariants.meta}
              sx="text-content-dark-secondary"
            />

            <Paragraph
              content={char.description}
              variant={paragraphVariants.meta}
              sx="text-content-dark-secondary/70 text-center mt-2"
            />
          </button>
        );
      })}
    </div>
  );
};

export default CharacterSelector;

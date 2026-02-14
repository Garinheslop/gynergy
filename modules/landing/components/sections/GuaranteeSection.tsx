"use client";

import { cn } from "@lib/utils/style";

import { GUARANTEE } from "../../data/content";
import { SectionWrapper } from "../shared";

export default function GuaranteeSection() {
  return (
    <SectionWrapper className="py-12 md:py-20">
      <div
        className={cn(
          "mx-auto max-w-[680px]",
          "border-lp-green border-2 p-8 md:p-12",
          "relative text-center",
          "bg-lp-green-dim"
        )}
      >
        {/* Seal */}
        <div
          className={cn(
            "absolute -top-5 right-8",
            "bg-lp-green h-14 w-14 rounded-full",
            "flex flex-col items-center justify-center"
          )}
        >
          <span className="font-bebas text-lp-white text-xl leading-none">{GUARANTEE.days}</span>
          <span className="font-oswald text-[7px] font-normal tracking-wider text-white/80 uppercase">
            Day
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bebas text-lp-green mb-4 text-2xl tracking-wide md:text-3xl">
          {GUARANTEE.title}
        </h3>

        {/* Description */}
        <p className="font-oswald text-lp-gray text-sm leading-relaxed font-extralight md:text-base">
          {GUARANTEE.description}
        </p>
      </div>
    </SectionWrapper>
  );
}

"use client";

import { useState } from "react";

import { cn } from "@lib/utils/style";

import { FAQ_ITEMS } from "../../data/faq";
import { SectionWrapper, SectionLabel, SectionTitle, GoldLine } from "../shared";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <SectionWrapper id="faq" variant="dark">
      <div className="text-center">
        <SectionLabel centered>Questions</SectionLabel>

        <SectionTitle centered>
          Frequently Asked
          <br />
          <span className="text-lp-gold-light">Questions</span>
        </SectionTitle>

        <GoldLine variant="center" />
      </div>

      <div
        className="mx-auto mt-10 max-w-[800px]"
        role="region"
        aria-label="Frequently Asked Questions"
      >
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className={cn("border-lp-border border-b", i === 0 && "border-t")}>
            {/* Question */}
            <button
              onClick={() => toggleItem(i)}
              className={cn(
                "flex w-full items-center justify-between py-5",
                "font-oswald text-lp-white text-sm font-medium tracking-wide md:text-base",
                "cursor-pointer border-none bg-transparent text-left",
                "focus-visible:ring-lp-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              )}
              aria-expanded={openIndex === i}
              aria-controls={`faq-answer-${i}`}
              id={`faq-question-${i}`}
            >
              <span className="pr-4">{item.question}</span>
              <span
                className={cn(
                  "font-oswald text-lp-gold text-2xl font-extralight",
                  "transition-transform duration-300",
                  openIndex === i && "rotate-45"
                )}
                aria-hidden="true"
              >
                +
              </span>
            </button>

            {/* Answer */}
            <div
              id={`faq-answer-${i}`}
              role="region"
              aria-labelledby={`faq-question-${i}`}
              className={cn(
                "overflow-hidden transition-all duration-400",
                openIndex === i ? "max-h-[400px] pb-5" : "max-h-0"
              )}
              hidden={openIndex !== i}
            >
              <p className="font-oswald text-lp-gray text-sm leading-relaxed font-extralight">
                {item.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

"use client";

import { FC } from "react";

import TextArea from "@modules/common/components/TextArea";
import Heading from "@modules/common/components/typography/Heading";
import { headingVariants, paragraphVariants } from "@resources/variants";

import Paragraph from "./typography/Paragraph";
interface TextAreaWithHeadingProps {
  heading?: string;
  description?: string;
  placeholder?: string;
  value?: string | null;
  wordLimit?: number;
  onChange: (value: string) => void;
}

const TextAreaWithHeading: FC<TextAreaWithHeadingProps> = ({
  heading,
  description,
  value,
  placeholder,
  wordLimit,
  onChange,
}) => {
  return (
    <section className="flex flex-col gap-1">
      {heading && (
        <Heading variant={headingVariants.title} sx="!font-bold">
          {heading}
        </Heading>
      )}
      {description && (
        <Paragraph
          content={description}
          variant={paragraphVariants.meta}
          sx="text-content-dark-secondary"
        />
      )}
      <TextArea
        value={value}
        placeholder={placeholder}
        wordLimit={wordLimit}
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  );
};

export default TextAreaWithHeading;

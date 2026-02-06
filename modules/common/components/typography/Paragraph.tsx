import React, { forwardRef } from "react";

import DOMPurify from "dompurify";

import useGetParagraphVariant from "@modules/common/hooks/variants/useGetParagraphVariant";
import { paragraphVariants } from "@resources/variants";

interface ParagraphProps {
  content?: string | number;
  variant?: (typeof paragraphVariants)[keyof typeof paragraphVariants];
  sx?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  isHtml?: boolean;
}

const Paragraph = forwardRef<HTMLParagraphElement | HTMLDivElement, ParagraphProps>(
  ({ content, variant = paragraphVariants.regular, sx = "", onClick, isHtml = false }, ref) => {
    const componentStyle = useGetParagraphVariant({ variant, sx });
    if (isHtml && content)
      return (
        <div
          ref={ref}
          onClick={onClick}
          className={componentStyle}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(content)) }}
        />
      );
    return (
      <p ref={ref} onClick={onClick} className={componentStyle}>
        {content}
      </p>
    );
  }
);

Paragraph.displayName = "Paragraph";

export default Paragraph;

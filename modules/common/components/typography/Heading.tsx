import React from "react";
import useGetHeadingVariant from "@modules/common/hooks/variants/useGetHeadingVariant";
import { headingVariants } from "@resources/variants";

interface HeadingProps {
  variant?: (typeof headingVariants)[keyof typeof headingVariants];
  children?: React.ReactNode;
  sx?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  isHtml?: boolean;
}

const Heading = ({
  variant = headingVariants.sectionHeading,
  children,
  isHtml,
  sx = "",
  onClick,
}: HeadingProps) => {
  const { componentStyle, Element } = useGetHeadingVariant({ variant, sx });
  const HeadingElement = Element as React.ElementType;

  if (isHtml) {
    const htmlContent = typeof children === "string" ? children : "";
    return (
      <div
        onClick={onClick}
        className={componentStyle}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  return (
    <HeadingElement onClick={onClick} className={componentStyle}>
      {children}
    </HeadingElement>
  );
};

export default Heading;

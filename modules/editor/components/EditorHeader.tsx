import { FC, ReactNode } from "react";

import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { buttonActionTypes } from "@resources/types/button";
import { headingVariants, paragraphVariants } from "@resources/variants";

interface EditorHeaderProps {
  heading: string;
  description?: string;
  headingVariant?: string;
  icon?: {
    class: string;
    name: string;
  };
  children?: ReactNode;
}

const EditorHeader: FC<EditorHeaderProps> = ({
  heading,
  description,
  headingVariant = headingVariants.heading,
  icon,
  children,
}) => {
  return (
    <section
      className={cn("flex flex-col gap-2.5", {
        "justify-between sm:flex-row sm:items-end": children,
      })}
    >
      <div className="flex items-center gap-2.5 sm:flex-col sm:items-start">
        {icon && <i className={cn(`gng-${icon.name} p-1 text-[32px]`, icon.class)} />}
        <Heading variant={headingVariant} sx={cn("!font-bold")}>
          {heading}
        </Heading>
      </div>
      {description && (
        <Paragraph
          content={description}
          variant={paragraphVariants.regular}
          sx="text-content-dark-secondary"
        />
      )}
      {children}
    </section>
  );
};

export default EditorHeader;

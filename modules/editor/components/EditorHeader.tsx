import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { buttonActionTypes } from "@resources/types/button";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { FC, ReactNode } from "react";

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
      className={cn("flex flex-col gap-[10px]", {
        "sm:flex-row justify-between sm:items-end": children,
      })}
    >
      <div className="flex items-center sm:items-start sm:flex-col gap-[10px]">
        {icon && <i className={cn(`gng-${icon.name} text-[32px] p-1`, icon.class)} />}
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

import React, { MouseEvent } from "react";
import { headingVariants, paragraphVariants } from "@resources/variants";
import Accordion from "./Accordion";
import Paragraph from "./typography/Paragraph";
import { ReactNode } from "react";
import { cn } from "@lib/utils/style";
import Heading from "./typography/Heading";
import ActionButton from "./ActionButton";
import { buttonActionTypes } from "@resources/types/button";
import TextSkeleton from "./skeleton/TextSkeleton";

interface CardProps {
  children?: ReactNode;
  title?: string;
  headingVariant?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  actionBtn?: {
    label: string;
    icon?: string;
    action: () => void;
  };
  primaryActionIconBtn?: {
    icon?: string;
    sx?: string;
    label?: string;
    action?: () => void;
  };
  secondaryActionIconBtn?: {
    icon?: string;
    sx?: string;
    label?: string;
    action?: () => void;
  };
  icon?: {
    class: string;
    label?: string;
    action?: () => void;
  };
  isLoading?: boolean;
  isHtml?: boolean;
  isOpen?: boolean;
  isStatic?: boolean;
  isAccordion?: boolean;
  isCompleted?: boolean;
  sx?: string;
}

const Card = ({
  children,
  title,
  onClick,
  isLoading = false,
  isHtml = false,
  headingVariant = headingVariants.title,
  isOpen = false,
  isStatic = false,
  isAccordion = false,
  isCompleted,
  icon,
  actionBtn,
  primaryActionIconBtn,
  secondaryActionIconBtn,
  sx,
}: CardProps) => {
  if (isAccordion)
    return (
      <Accordion
        title={title}
        isOpen={isOpen}
        isStatic={isStatic}
        secondaryActionIconBtn={secondaryActionIconBtn}
        primaryActionIconBtn={primaryActionIconBtn}
        sx={sx}
      >
        {children}
      </Accordion>
    );
  else
    return (
      <section
        className={cn(
          "flex flex-col h-full w-full bg-bkg-light p-5 md:p-[30px] gap-[30px] rounded sm:rounded-[20px] duration-150",
          {
            "cursor-pointer": onClick,
            "hover:translate-y-[-2px]": onClick,
            "cursor-default grayscale card-loading hover:translate-y-[0px]": isLoading,
          },
          sx
        )}
        onClick={(e) => onClick && !isLoading && onClick(e)}
      >
        <div className={cn("flex items-center justify-between gap-5")}>
          <div className="flex md:flex-row flex-col gap-5 md:items-center w-full">
            <Heading
              isHtml={isHtml}
              variant={headingVariant}
              sx={"!font-bold [&>*]:!font-bold md:text-nowrap"}
            >
              {title}
            </Heading>

            {actionBtn?.action && (
              <ActionButton
                label={actionBtn.label}
                onClick={actionBtn.action}
                buttonActionType={buttonActionTypes.text}
                icon={actionBtn.icon}
                sx="[&>i]:text-[25px] w-max hover:!bg-transparent hover:!px-0 flex-row-reverse"
              />
            )}
          </div>
          {(icon || primaryActionIconBtn?.action) && !isLoading && (
            <div
              className={cn("flex gap-[5px] items-center h-full", {
                "cursor-pointer": primaryActionIconBtn?.action,
              })}
              onClick={icon?.action}
            >
              <i
                className={cn(
                  `gng-${primaryActionIconBtn?.icon ?? icon?.class} text-[24px] text-content-dark duration-500`
                )}
                onClick={() => primaryActionIconBtn?.action && primaryActionIconBtn?.action()}
              />
              {icon?.label && (
                <Paragraph
                  content={icon.label}
                  variant={paragraphVariants.regular}
                  sx="text-nowrap hidden md:flex"
                />
              )}
            </div>
          )}
        </div>
        {children}
      </section>
    );
};

export default Card;

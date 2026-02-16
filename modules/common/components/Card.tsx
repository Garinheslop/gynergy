import React, { MouseEvent } from "react";
import { ReactNode } from "react";

import { cn } from "@lib/utils/style";
import { buttonActionTypes } from "@resources/types/button";
import { headingVariants, paragraphVariants } from "@resources/variants";

import Accordion from "./Accordion";
import ActionButton from "./ActionButton";
import TextSkeleton from "./skeleton/TextSkeleton";
import Heading from "./typography/Heading";
import Paragraph from "./typography/Paragraph";

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
          "bg-bkg-light flex h-full w-full flex-col gap-8 rounded p-5 duration-150 sm:rounded-large md:p-8",
          {
            "cursor-pointer": onClick,
            "hover:translate-y-[-2px]": onClick,
            "card-loading cursor-default grayscale hover:translate-y-[0px]": isLoading,
          },
          sx
        )}
        onClick={(e) => onClick && !isLoading && onClick(e)}
      >
        <div className={cn("flex items-center justify-between gap-5")}>
          <div className="flex w-full flex-col gap-5 md:flex-row md:items-center">
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
              className={cn("flex h-full items-center gap-1", {
                "cursor-pointer": primaryActionIconBtn?.action,
              })}
              onClick={icon?.action}
            >
              <i
                className={cn(
                  `gng-${primaryActionIconBtn?.icon ?? icon?.class} text-content-dark text-2xl duration-500`
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

import { ReactNode, MouseEvent, useEffect, useRef, useState } from "react";
import { headingVariants, paragraphVariants } from "@resources/variants";
import Heading from "./typography/Heading";
import { cn } from "@lib/utils/style";
import Paragraph from "./typography/Paragraph";

interface AccordionProps {
  children: ReactNode;
  title?: string;
  isOpen: boolean;
  isStatic?: boolean;
  icon?: {
    class: string;
    label?: string;
    action?: () => void;
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
  sx?: string;
}

const Accordion = ({
  children,
  title,
  isOpen,
  primaryActionIconBtn,
  secondaryActionIconBtn,
  isStatic = false,
  sx,
}: AccordionProps) => {
  const accordionRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [isRenderContent, setIsRenderContent] = useState<boolean>(false);

  useEffect(() => {
    if (!isStatic) {
      setOpen(isOpen);
    }
  }, [isOpen, isStatic]);

  useEffect(() => {
    if (!isStatic) {
      if (!open) {
        const delayFn = setTimeout(() => {
          setIsRenderContent(false);
        }, 1000);
        return () => clearTimeout(delayFn);
      } else {
        setIsRenderContent(open);
      }
    }
  }, [open, isStatic]);

  const accordionHandler = (e: MouseEvent<HTMLElement>) => {
    if (!isStatic) {
      const target = e.target as HTMLElement;
      const parent = target.parentElement;
      const grandparent = parent?.parentElement;
      if ([target.id, parent?.id, grandparent?.id].includes("accordion-header")) {
        setOpen((prev) => !prev);
      }
    }
  };

  return (
    <section
      aria-label="accordion"
      ref={accordionRef}
      className={cn(
        "flex flex-col h-full w-full rounded sm:rounded-[20px] bg-bkg-light p-5 md:p-[30px] group",
        sx
      )}
      onClick={accordionHandler}
    >
      <div
        className={cn("flex cursor-pointer items-center justify-between", {
          "cursor-default": isStatic,
        })}
        id="accordion-header"
      >
        {title && (
          <Heading variant={headingVariants.cardHeading} sx="!font-bold">
            {title}
          </Heading>
        )}
        <div className="flex gap-[20px] items-center h-full">
          {secondaryActionIconBtn && (
            <>
              <div className="flex items-center gap-[10px]">
                <i
                  className={cn(
                    `gng-${secondaryActionIconBtn?.icon} text-action-secondary text-[20px] duration-150 cursor-pointer`,
                    secondaryActionIconBtn?.sx,
                    { "opacity-0 group-hover:opacity-100": isStatic }
                  )}
                  onClick={() => secondaryActionIconBtn?.action && secondaryActionIconBtn?.action()}
                />
                {secondaryActionIconBtn?.label && (
                  <Paragraph
                    content={secondaryActionIconBtn.label}
                    variant={paragraphVariants.regular}
                    sx="text-nowrap hidden md:flex"
                  />
                )}
              </div>
              <div className="h-[30px] w-[1px] border-r border-border-light" />
            </>
          )}
          {(open || isStatic) && (
            <>
              <div className="flex gap-[10px]">
                <i
                  className={cn(
                    `gng-${primaryActionIconBtn?.icon} text-action-secondary text-[20px] duration-150 cursor-pointer`,
                    primaryActionIconBtn?.sx,
                    { "opacity-0 group-hover:opacity-100": isStatic }
                  )}
                  onClick={() => primaryActionIconBtn?.action && primaryActionIconBtn?.action()}
                />
                {primaryActionIconBtn?.label && (
                  <Paragraph
                    content={primaryActionIconBtn.label}
                    variant={paragraphVariants.regular}
                    sx="text-nowrap hidden md:flex"
                  />
                )}
              </div>
              {!isStatic && <div className="h-[30px] w-[1px] border-r border-border-light" />}
            </>
          )}
          {!isStatic && (
            <i
              className={cn("gng-arrow-down-thin text-content-dark-secondary duration-500", {
                "rotate-180": open,
              })}
            />
          )}
        </div>
      </div>
      <div
        className={cn(
          "overflow-hidden flex flex-col gap-5 md:gap-[30px] px-1 transition-all duration-500 sm:p-0 max-h-0 ease-out",
          { "max-h-[350vh] ease-in": open || isStatic }
        )}
      >
        <div className="w-full border-b border-border-light mt-5 md:mt-[30px]" />
        {(isRenderContent || isStatic) && children}
      </div>
    </section>
  );
};

export default Accordion;

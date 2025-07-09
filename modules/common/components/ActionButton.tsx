import React, { useEffect, useRef, useState, MouseEvent, ChangeEvent } from "react";
import Link from "next/link";
// lib
import { cn } from "@lib/utils/style";
// resources
import { buttonActionTypes } from "@resources/types/button";
import { paragraphVariants } from "@resources/variants";
// components
import Paragraph from "./typography/Paragraph";
import Spinner from "./Spinner";

interface ActionButtonProps {
  buttonActionType?: string;
  paragraphVariant?: string;
  label?: string;
  href?: string;
  isNewWindow?: boolean;
  icon?: string;
  isLoading?: boolean;
  isSpinner?: boolean;
  isActive?: boolean;
  disabled?: boolean;
  onFileInput?: (e: ChangeEvent<HTMLInputElement>) => void;
  sx?: string;
  // onClick is used differently by subcomponents. Here we use a union;
  // you might consider splitting this prop in a more granular way.
  onClick?: ((e: MouseEvent<HTMLButtonElement>) => void) | ((active: boolean) => void);
  onHover?: (hover: boolean) => void;
}

interface ButtonProps {
  label?: string;
  buttonActionType?: string;
  paragraphVariant?: string;
  icon?: string;
  onFileInput?: (e: ChangeEvent<HTMLInputElement>) => void;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  isLoading?: boolean;
  isSpinner?: boolean;
  disabled?: boolean;
  onHover?: (hover: boolean) => void;
  sx?: string;
}

interface TextButtonProps {
  label?: string;
  paragraphVariant?: string;
  icon?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  sx?: string;
}

interface RadioBtnProps {
  label?: string;
  paragraphVariant?: string;
  onClick?: () => void;
  disabled?: boolean;
  sx?: string;
  isSelected?: boolean;
}

interface RadioQuizBtnProps {
  label?: string;
  paragraphVariant?: string;
  onClick?: (isSelected: boolean) => void;
  disabled?: boolean;
  sx?: string;
  isSelected?: boolean;
}

interface CheckButtonProps {
  label?: string;
  paragraphVariant?: string;
  buttonActionType?: string;
  onClick?: (active: boolean) => void;
  disabled?: boolean;
  isActive?: boolean;
  sx?: string;
}

interface SliderBtnProps {
  label?: string;
  paragraphVariant?: string;
  icon?: string;
  isLoading?: boolean;
  onClick?: (active: boolean) => void;
  disabled?: boolean;
  isActive?: boolean;
  sx?: string;
}

interface ToggleBtnProps {
  label?: string;
  paragraphVariant?: string;
  icon?: string;
  onClick?: (active: boolean) => void;
  disabled?: boolean;
  isActive?: boolean;
  sx?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  buttonActionType = buttonActionTypes.default,
  paragraphVariant = paragraphVariants.regular,
  label,
  href,
  isNewWindow,
  icon,
  isLoading,
  isSpinner,
  isActive,
  disabled,
  onFileInput,
  sx,
  onClick,
  onHover,
}) => {
  if (buttonActionType === buttonActionTypes.default)
    return (
      <Button
        label={label}
        paragraphVariant={paragraphVariant}
        icon={icon}
        onFileInput={onFileInput}
        onClick={onClick as (e: MouseEvent<HTMLButtonElement>) => void}
        isLoading={isLoading}
        isSpinner={isSpinner}
        disabled={disabled}
        sx={sx}
      />
    );

  if (buttonActionType === buttonActionTypes.outlined)
    return (
      <Button
        label={label}
        paragraphVariant={paragraphVariant}
        icon={icon}
        onFileInput={onFileInput}
        onClick={onClick as (e: MouseEvent<HTMLButtonElement>) => void}
        isLoading={isLoading}
        isSpinner={isSpinner}
        onHover={onHover}
        disabled={disabled}
        sx={cn("bg-[#27282A] hover:bg-[#27282A]/80 border border-border-light", sx)}
      />
    );
  else if (buttonActionType === buttonActionTypes.text)
    return (
      <TextButton
        paragraphVariant={paragraphVariant}
        label={label}
        icon={icon}
        onClick={onClick as (e: MouseEvent<HTMLButtonElement>) => void}
        disabled={disabled}
        sx={sx}
      />
    );
  else if (buttonActionType === buttonActionTypes.link) {
    if (!href) return null;
    return (
      <Link href={href} target={isNewWindow ? "_blank" : undefined}>
        <Button
          icon={icon}
          paragraphVariant={paragraphVariant}
          buttonActionType={buttonActionType}
          isLoading={isLoading}
          label={label}
          disabled={disabled}
          sx={sx}
        />
      </Link>
    );
  } else if (buttonActionType === buttonActionTypes.check)
    return (
      <CheckButton
        label={label}
        buttonActionType={buttonActionType}
        paragraphVariant={paragraphVariant}
        isActive={isActive}
        onClick={onClick as (active: boolean) => void}
        disabled={disabled}
        sx={sx}
      />
    );
  else if (buttonActionType === buttonActionTypes.radio)
    return (
      <RadioBtn
        label={label}
        paragraphVariant={paragraphVariant}
        isSelected={isActive}
        onClick={onClick as () => void}
        disabled={disabled}
        sx={sx}
      />
    );
  else if (buttonActionType === buttonActionTypes.slider)
    return (
      <SliderBtn
        label={label}
        paragraphVariant={paragraphVariant}
        icon={icon}
        isLoading={isLoading}
        isActive={isActive}
        onClick={onClick as (active: boolean) => void}
        disabled={disabled}
        sx={sx}
      />
    );
  else if (buttonActionType === buttonActionTypes.toggle)
    return (
      <ToggleBtn
        label={label}
        paragraphVariant={paragraphVariant}
        icon={icon}
        isActive={isActive}
        onClick={onClick as (active: boolean) => void}
        disabled={disabled}
        sx={sx}
      />
    );

  return null;
};

const Button: React.FC<ButtonProps> = ({
  label,
  buttonActionType,
  paragraphVariant = paragraphVariants.regular,
  icon,
  onFileInput,
  onClick,
  isLoading,
  isSpinner,
  disabled,
  onHover,
  sx,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      className={cn(
        "flex w-full items-center justify-center gap-[10px] rounded px-[25px] py-[5px] text-content-dark duration-150 cursor-pointer disabled:cursor-default",
        disabled || isLoading
          ? "bg-bkg-disabled/20 text-content-dark/40 [&>p]:text-content-dark/40"
          : "bg-action hover:bg-action-100",
        {
          "min-h-[57px]": paragraphVariant === paragraphVariants.regular,
          "min-h-[46px]": paragraphVariant === paragraphVariants.meta,
        },
        sx
      )}
      onClick={(e) => {
        if (buttonActionType !== buttonActionTypes.link) {
          if (onFileInput) {
            if (!disabled && !isLoading && inputRef.current) {
              inputRef.current.value = "";
              inputRef.current.click();
            }
          } else {
            e.preventDefault();
            if (!disabled && !isLoading && onClick) onClick(e);
          }
        }
      }}
      onMouseOver={() => onHover && onHover(true)}
      onMouseLeave={() => onHover && onHover(false)}
      disabled={disabled || isLoading}
    >
      {icon && !isLoading && <i className={cn(`gng-${icon} duration-150`, "text-[20px]")} />}
      {label && (
        <>
          {isSpinner && isLoading ? (
            <Spinner sx="h-6 w-6" />
          ) : (
            <Paragraph
              content={label}
              variant={paragraphVariant}
              sx={cn(`w-max capitalize ${isLoading ? "text-loading" : ""}`, {
                "!font-bold": paragraphVariant === paragraphVariants.regular,
              })}
            />
          )}
        </>
      )}
      {onFileInput && (
        <input
          ref={inputRef}
          type="file"
          name="file"
          id="file"
          hidden
          accept=".png,.jpg,.jpeg,.mp4,.mov"
          onChange={(e) => onFileInput(e)}
        />
      )}
    </button>
  );
};

const TextButton: React.FC<TextButtonProps> = ({
  label,
  paragraphVariant = paragraphVariants.regular,
  icon,
  onClick,
  disabled,
  sx,
}) => {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-[10px] duration-150 group py-2 rounded group",
        disabled ? "[&>p,i]:text-content-dark/30" : "cursor-pointer hover:bg-action hover:px-4",
        sx
      )}
      onClick={(e) => {
        if (!disabled && onClick) onClick(e);
      }}
      disabled={disabled}
    >
      {icon && (
        <i
          className={cn(`gng-${icon}`, "text-content-dark text-[22px] duration-150 ", {
            "group-hover:translate-x-[3px]": !disabled,
          })}
        />
      )}
      {label && (
        <Paragraph content={label} variant={paragraphVariant} sx={cn(`w-max capitalize`)} />
      )}
    </button>
  );
};

const RadioBtn: React.FC<RadioBtnProps> = ({
  label,
  paragraphVariant = paragraphVariants.meta,
  onClick,
  disabled,
  sx,
  isSelected,
}) => {
  return (
    <button
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4 px-4 py-2 text-content-dark",
        sx
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="border-border-5/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-transparent">
        {isSelected && <span className="bg-bkg-reverse h-3 w-3 rounded-full" />}
      </div>
      <Paragraph content={label} variant={paragraphVariant} sx="text-start" />
    </button>
  );
};

const RadioQuizBtn: React.FC<RadioQuizBtnProps> = ({
  label,
  paragraphVariant = paragraphVariants.meta,
  onClick,
  disabled,
  sx,
  isSelected,
}) => {
  const onSelectHandler = () => {
    if (onClick) onClick(!isSelected);
  };

  return (
    <button
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4 px-4 py-2 text-content-dark",
        { "cursor-default": disabled },
        sx
      )}
      disabled={disabled}
      onClick={onSelectHandler}
    >
      <div
        className={cn(
          "flex-center border-border-3/10 h-6 w-6 flex-shrink-0 rounded-full border bg-bkg-light text-[10px] text-white sm:h-7 sm:w-7 sm:text-[12px]"
        )}
      >
        {isSelected && <span className="h-6 w-6 rounded-full bg-active" />}
      </div>
      <Paragraph content={label} variant={paragraphVariant} sx="text-start" />
    </button>
  );
};

const CheckButton: React.FC<CheckButtonProps> = ({
  label,
  paragraphVariant = paragraphVariants.meta,
  buttonActionType,
  onClick,
  disabled,
  isActive,
  sx,
}) => {
  const onCheckHandler = () => {
    if (onClick) onClick(!isActive);
  };

  return (
    <button
      className={cn(
        "flex w-full items-center justify-start gap-4 rounded p-4",
        isActive ? "bg-bkg-light" : "bg-transparent",
        sx
      )}
      disabled={disabled}
      onClick={onCheckHandler}
    >
      <div
        className={cn(
          "flex-center border-border-3/10 h-6 w-6 flex-shrink-0 rounded-full border text-[10px] text-white sm:h-7 sm:w-7 sm:text-[12px]",
          isActive ? "bg-active" : "bg-bkg-light",
          { "cursor-default": disabled },
          { rounded: buttonActionType === buttonActionTypes.check }
        )}
      >
        {isActive && <i className="gng-check" />}
      </div>
      <Paragraph content={label} variant={paragraphVariant} sx="text-start" />
    </button>
  );
};

const SliderBtn: React.FC<SliderBtnProps> = ({
  label,
  paragraphVariant = paragraphVariants.regular,
  icon,
  isLoading,
  onClick,
  disabled,
  isActive,
  sx,
}) => {
  const [sliderState, setSliderState] = useState<boolean>(!!isActive);

  useEffect(() => {
    setSliderState(!!isActive);
  }, [isActive]);

  const onSliderToggleHandler = () => {
    if (!disabled && onClick) {
      setSliderState(!sliderState);
      onClick(!sliderState);
    }
  };

  return (
    <section className={cn("flex items-center", sx)}>
      <button
        id="slider"
        className={cn(
          "relative flex h-[24px] w-[46px] flex-shrink-0 cursor-pointer items-center rounded-[73px] outline-none duration-150",
          !sliderState ? "bg-border-light-secondary" : "bg-action",
          {
            "cursor-default bg-bkg-disabled/40 text-content-dark/60": disabled,
            "text-loading": isLoading,
          }
        )}
        onClick={onSliderToggleHandler}
        disabled={disabled}
      >
        <span
          className={cn(
            "mx-[2px] flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center rounded-full transition-all duration-150",
            !sliderState
              ? "bg-content/50 translate-x-0 transform bg-white"
              : "translate-x-[22px] transform bg-white",
            { "bg-white/70": disabled }
          )}
        >
          {icon && (
            <i
              className={cn(
                `gng-${icon} text-[14px] duration-150`,
                sliderState ? "text-danger-light" : " text-action",
                { "text-content-dark/70": disabled }
              )}
            />
          )}
        </span>
      </button>
      {label && <Paragraph content={label} variant={paragraphVariant} sx="w-full" />}
    </section>
  );
};

const ToggleBtn: React.FC<ToggleBtnProps> = ({
  label,
  paragraphVariant = paragraphVariants.regular,
  icon,
  onClick,
  disabled,
  isActive,
  sx,
}) => {
  const [sliderState, setSliderState] = useState<boolean>(!!isActive);

  useEffect(() => {
    setSliderState(!!isActive);
  }, [isActive]);

  const onSliderToggleHandler = () => {
    if (!disabled && onClick) {
      setSliderState(!sliderState);
      onClick(!sliderState);
    }
  };

  return (
    <section className={cn("flex items-center", sx)}>
      <button
        className={cn(
          "relative flex h-7 w-[62px] flex-shrink-0 cursor-pointer items-center rounded-[73px] outline-none duration-150",
          sliderState ? "bg-danger-light" : "bg-action",
          { "cursor-default bg-bkg-disabled/40 text-content-dark/60": disabled }
        )}
        onClick={onSliderToggleHandler}
        disabled={disabled}
      >
        <span
          className={cn(
            "mx-[2px] flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-white transition-all duration-150",
            sliderState ? "translate-x-0 transform" : "translate-x-[36px] transform",
            { "bg-white/70": disabled }
          )}
        >
          {icon && (
            <i
              className={cn(
                `gng-${icon} text-[14px] duration-150`,
                sliderState ? "text-danger-light" : " text-action",
                { "text-content-dark/70": disabled }
              )}
            />
          )}
        </span>
      </button>
      {label && <Paragraph content={label} variant={paragraphVariant} sx="w-full" />}
    </section>
  );
};

export default ActionButton;

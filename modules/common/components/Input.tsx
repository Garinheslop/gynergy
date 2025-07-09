import {
  useEffect,
  useState,
  ChangeEvent,
  KeyboardEvent,
  FocusEvent,
  MouseEvent,
  FC,
  Ref,
} from "react";
import { cn } from "@lib/utils/style";
import Paragraph from "./typography/Paragraph";
import { paragraphVariants } from "@resources/variants";

interface InputProps {
  label?: string;
  inputRef?: Ref<HTMLInputElement>;
  value: string;
  type?: string;
  icon?: string;
  inputIcon?: string;
  inputPlaceholder?: string;
  paragraphVariant?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  onFocusHandler?: (event: FocusEvent<HTMLInputElement> | MouseEvent<HTMLElement>) => void;
  onBlurHandler?: (event: FocusEvent<HTMLInputElement>) => void;
  sx?: string;
  inputSx?: string;
}

const Input: FC<InputProps> = ({
  label,
  inputRef,
  value,
  type = "text",
  icon,
  inputIcon,
  inputPlaceholder,
  paragraphVariant = paragraphVariants.regular,
  onChange,
  onKeyDown,
  error,
  disabled,
  onFocusHandler,
  onBlurHandler,
  sx,
  inputSx,
}) => {
  const [content, setContent] = useState<string>("");
  const [show, setShow] = useState<boolean>(false);

  useEffect(() => {
    setContent(value);
  }, [value]);

  const onInputChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    setContent(event.target.value);
    if (onChange) {
      onChange(event);
    }
  };

  const onKeyDownHandler = (event: KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) {
      onKeyDown(event);
    }
  };

  return (
    <section
      className={cn("relative flex w-full items-start justify-center flex-col gap-[5px]", sx)}
    >
      {label && <Paragraph content={label} variant={paragraphVariant} sx="text-content-dark" />}
      {icon && <i className={`gng-${icon} text-body ml-4 text-content-dark`} />}
      <section
        className={cn(
          "relative flex w-full items-center rounded border border-border-light [&>input]:px-[15px] [&>input]:py-[10px] overflow-hidden min-h-[47px]",
          inputSx,
          { "border-danger": error },
          {
            "placeholder:text-content-dark-secondary bg-bkg-disabled/10 text-content-dark-secondary":
              disabled,
          }
        )}
      >
        <input
          ref={inputRef}
          type={show ? "text" : type}
          className={cn(
            "flex h-full w-full bg-transparent text-start outline-none text-content-dark",
            { "text-body": paragraphVariant === paragraphVariants.regular }
          )}
          value={content}
          onChange={onInputChangeHandler}
          onKeyDown={onKeyDownHandler}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder={inputPlaceholder}
          disabled={disabled}
          onFocus={onFocusHandler as ((e: FocusEvent<HTMLInputElement>) => void) | undefined}
          onBlur={onBlurHandler}
        />
        {inputIcon && (
          <i
            className={`gng-${inputIcon} text-body -ml-8 ${
              disabled ? "cursor-default" : "cursor-pointer"
            } text-content-dark`}
            onClick={(e: MouseEvent<HTMLElement>) => {
              if (onFocusHandler) onFocusHandler(e);
            }}
          />
        )}
        {type === "password" && (
          <i
            className="gng-eye text-content-dark-secondary absolute right-[10px] cursor-pointer"
            onClick={() => setShow((prev) => !prev)}
          >
            {!show && (
              <span className="w-[20px] absolute right-[-2px] top-[8px] border-t border-[#8F9194] -rotate-45" />
            )}
          </i>
        )}
      </section>
      {error && (
        <Paragraph
          content={error}
          variant={paragraphVariants.meta}
          sx="text-sm text-danger text-start"
        />
      )}
    </section>
  );
};

export default Input;

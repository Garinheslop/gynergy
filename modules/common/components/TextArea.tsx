import React, {
  forwardRef,
  useEffect,
  useState,
  ChangeEvent,
  KeyboardEvent,
  ClipboardEvent,
  useRef,
} from "react";
// utils
import { cn } from "@lib/utils/style";
// resources
import Paragraph from "@modules/common/components/typography/Paragraph";
import { paragraphVariants } from "@resources/variants";

interface TextAreaProps {
  value?: string | null;
  rows?: number;
  placeholder?: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onPasteHandler?: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  wordLimit?: number;
  sx?: string;
  textareaSx?: string;
  children?: React.ReactNode;
  resetEditor?: boolean;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      value,
      rows = 4,
      placeholder = "Write here...",
      onChange,
      onKeyDown,
      onPasteHandler,
      disabled,
      wordLimit,
      sx,
      textareaSx,
      children,
      resetEditor,
    },
    ref
  ) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const [content, setContent] = useState<string>("");
    const [textAreaRows, setTextAreaRows] = useState<number>(rows);
    const [wordCount, setWordCount] = useState<number>(0);
    const [wordLimitReached, setWordLimitReached] = useState<boolean>(false);

    useEffect(() => {
      if (resetEditor) {
        setContent("");
        setWordCount(0);
      }
    }, [resetEditor]);

    useEffect(() => {
      if (rows) {
        setTextAreaRows(rows);
      }
    }, [rows]);

    useEffect(() => {
      if (value) {
        setContent(value);
        setWordCount(value.split(" ").length);
      } else if (!value) {
        setContent("");
      }
    }, [value]);

    useEffect(() => {
      if (textAreaRef?.current) {
        if (textAreaRef?.current.scrollHeight > textAreaRef?.current.clientHeight) {
          if (textAreaRows < 20) {
            setTextAreaRows(
              (prevRows) =>
                prevRows +
                Math.ceil(
                  (textAreaRef?.current!.scrollHeight - textAreaRef?.current!.clientHeight) / 27
                )
            );
          }
        }
      }
    }, [content]);

    const onInputChangeHandler = (event: ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      const newValLn = newValue.split(" ").length;
      if (wordLimit && newValLn < wordLimit) {
        setWordCount(newValue.split(" ").length);
        setWordLimitReached(false);
      } else if (wordLimit && newValLn === wordLimit) {
        setWordLimitReached(true);
      }

      if (!wordLimit || newValLn < wordLimit) {
        calculateRows(event);
        setContent(newValue);
        onChange && onChange(event);
      }
    };
    const calculateRows = (event: ChangeEvent<HTMLTextAreaElement>) => {
      if (!event.target.value) {
        setTextAreaRows(rows);
      }

      if (event.target.scrollHeight > event.target.clientHeight) {
        if (textAreaRows < 20) {
          setTextAreaRows(
            (prevRows) =>
              prevRows + Math.ceil((event.target.scrollHeight - event.target.clientHeight) / 27)
          );
        }
      }
    };
    return (
      <section className={cn("relative flex w-full items-start justify-center rounded", sx)}>
        <textarea
          ref={ref ?? textAreaRef}
          value={content}
          rows={textAreaRows}
          onChange={onInputChangeHandler}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "box-border w-full bg-bkg-light border border-border-light outline-0 rounded p-4 text-content-dark placeholder-content-dark/40 text-body resize-none transition-all duration-300 ease focus:outline-none focus:border-action focus:shadow-[0_0_0_2px_rgba(255,200,120,0.1)]",
            textareaSx
          )}
        />
        {children}
        {wordLimit && wordLimitReached && (
          <Paragraph
            content={wordLimitReached ? "Word limit reached!" : `${wordCount}/${wordLimit}`}
            variant={paragraphVariants.meta}
            sx={cn("absolute right-2 bottom-0 text-content/60 duration-150", {
              "text-danger": wordLimitReached,
            })}
          />
        )}
      </section>
    );
  }
);

export default TextArea;

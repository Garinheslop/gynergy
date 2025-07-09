import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import { buttonActionTypes } from "@resources/types/button";
import { FC } from "react";

interface EditorActionBtnsProps {
  isScanned: boolean;
  isDisabled?: boolean;
  onScan: () => void;
  onClear: () => void;
  sx?: string;
}

const EditorActionBtns: FC<EditorActionBtnsProps> = ({
  isScanned,
  onScan,
  onClear,
  isDisabled = false,
  sx,
}) => {
  return (
    <section className={cn("flex gap-5 ml-auto w-full sm:w-max", sx)}>
      {isScanned && (
        <ActionButton
          label="Clear All Fields"
          icon="close"
          onClick={onClear}
          buttonActionType={buttonActionTypes.text}
          sx={"w-max ml-auto [&>i]:text-[14px]"}
        />
      )}
      <ActionButton
        label="Scan & Fill"
        icon="scan"
        onClick={onScan}
        disabled={isScanned || isDisabled}
        sx={cn("sm:w-max w-full", { "hidden md:flex": isScanned })}
      />
    </section>
  );
};

export default EditorActionBtns;

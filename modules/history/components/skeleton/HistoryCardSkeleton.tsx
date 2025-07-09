import { cn } from "@lib/utils/style";
import TextSkeleton from "@modules/common/components/skeleton/TextSkeleton";
import React from "react";

function HistoryCardSkeleton({ isVision }: { isVision?: boolean }) {
  return (
    <div
      className={cn(
        "p-5 rounded flex flex-col justify-between h-[180px] gap-[10px] shadow-2xs bg-bkg-light",
        { "justify-start": isVision }
      )}
    >
      <TextSkeleton sx={cn("h-[20px] w-[50%]", { "w-full": isVision })} />
      {!isVision && <div className="w-full border-t border-border-light" />}
      {isVision ? (
        <div className="flex gap-[10px] items-center mt-[30px]">
          <TextSkeleton sx="size-[25px]" />
          <TextSkeleton sx="w-[100px]" />
        </div>
      ) : (
        <div className="flex justify-between py-[15px]">
          <TextSkeleton sx="size-[25px]" />
          <TextSkeleton sx="size-[25px]" />
          <TextSkeleton sx="size-[25px]" />
        </div>
      )}
      {!isVision && <TextSkeleton sx="h-[14px] w-[70%] mx-auto" />}
    </div>
  );
}

export default HistoryCardSkeleton;

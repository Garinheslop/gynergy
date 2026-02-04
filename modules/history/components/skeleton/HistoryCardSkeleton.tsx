import React from "react";

import { cn } from "@lib/utils/style";
import TextSkeleton from "@modules/common/components/skeleton/TextSkeleton";

function HistoryCardSkeleton({ isVision }: { isVision?: boolean }) {
  return (
    <div
      className={cn(
        "bg-bkg-light flex h-[180px] flex-col justify-between gap-[10px] rounded p-5 shadow-2xs",
        { "justify-start": isVision }
      )}
    >
      <TextSkeleton sx={cn("h-[20px] w-[50%]", { "w-full": isVision })} />
      {!isVision && <div className="border-border-light w-full border-t" />}
      {isVision ? (
        <div className="mt-[30px] flex items-center gap-[10px]">
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

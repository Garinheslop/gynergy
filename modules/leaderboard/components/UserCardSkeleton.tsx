import React from "react";

import TextSkeleton from "@modules/common/components/skeleton/TextSkeleton";

function UserCardSkeleton() {
  return (
    <div className="bg-bkg-light border-border-light flex items-center gap-2.5 rounded border p-5 shadow-2xs sm:gap-5">
      <div className="flex w-[50px] items-center justify-center sm:w-[84px]">
        <TextSkeleton sx="size-[25px]" />
      </div>
      <TextSkeleton sx="sm:size-[50px] size-[30px] rounded-full" />
      <TextSkeleton sx="sm:w-[100px] w-[50px] h-5" />
      <TextSkeleton sx="sm:w-[100px] w-[50px] h-5" />
      <TextSkeleton sx="sm:w-[100px] w-[50px] ml-auto h-5" />
    </div>
  );
}

export default UserCardSkeleton;

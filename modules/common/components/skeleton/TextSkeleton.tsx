import { cn } from "@lib/utils/style";

const TextSkeleton = ({ sx }: { sx: string }) => {
  return (
    <div
      className={cn("card-loading bg-bkg-disabled z-[10] flex h-[20px] w-full rounded-[5px]", sx)}
    />
  );
};

export default TextSkeleton;

import { cn } from "@lib/utils/style";

const TextSkeleton = ({ sx }: { sx: string }) => {
  return (
    <div
      className={cn("card-loading bg-bkg-disabled z-10 flex h-5 w-full rounded", sx)}
    />
  );
};

export default TextSkeleton;

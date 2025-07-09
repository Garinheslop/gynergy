import { cn } from "@lib/utils/style";

const TextSkeleton = ({ sx }: { sx: string }) => {
  return (
    <div
      className={cn("flex card-loading z-[10] h-[20px] w-full bg-bkg-disabled rounded-[5px]", sx)}
    />
  );
};

export default TextSkeleton;

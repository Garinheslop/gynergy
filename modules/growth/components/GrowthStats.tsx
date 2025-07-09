"use client";

import { cn } from "@lib/utils/style";
import TextSkeleton from "@modules/common/components/skeleton/TextSkeleton";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { paragraphVariants } from "@resources/variants";

interface GrowthStatsProps {
  progress: number;
  currentPoints: number;
  isLoading?: boolean;
  milestones: any[];
  sx?: string;
}

export default function GrowthStats({
  progress,
  currentPoints,
  milestones,
  isLoading,
  sx,
}: GrowthStatsProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row xl:flex-col xmd:p-0 p-[20px] gap-[20px] bg-bkg-ligh-secondary",
        sx
      )}
    >
      <div className="flex flex-col gap-[5px] items-center p-5 bg-grey-50 rounded">
        <Paragraph
          content={"Current Level"}
          variant={paragraphVariants.meta}
          sx="text-content-dark-secondary text-nowrap"
        />
        {isLoading ? (
          <TextSkeleton sx="w-[150px]" />
        ) : (
          <Paragraph
            content={
              milestones.find(
                (milestone) =>
                  milestone.startPoint <= currentPoints &&
                  (!milestone.endPoint || milestone.endPoint >= currentPoints)
              )?.name
            }
            variant={paragraphVariants.titleLg}
            sx="!font-bold"
          />
        )}
      </div>
      <div className="flex flex-col gap-[5px] items-center p-5 bg-grey-50 rounded">
        <Paragraph
          content={"Journal Progress"}
          variant={paragraphVariants.meta}
          sx="text-content-dark-secondary text-nowrap"
        />
        {isLoading ? (
          <TextSkeleton sx="w-[50px]" />
        ) : (
          <Paragraph
            content={`${progress.toFixed(0)}%`}
            variant={paragraphVariants.titleLg}
            sx="!font-bold"
          />
        )}
      </div>
      {milestones.find((milestone) => milestone.startPoint > currentPoints) && (
        <div className="flex flex-col gap-[5px] items-center p-5 bg-grey-50 rounded">
          <Paragraph
            content={"Points to next level"}
            variant={paragraphVariants.meta}
            sx="text-content-dark-secondary text-nowrap"
          />
          {isLoading ? (
            <TextSkeleton sx="w-[70px]" />
          ) : (
            <Paragraph
              content={
                milestones.find((milestone) => milestone.startPoint > currentPoints).startPoint -
                currentPoints
              }
              variant={paragraphVariants.titleLg}
              sx="!font-bold"
            />
          )}
        </div>
      )}
    </div>
  );
}

import Heading from "@modules/common/components/typography/Heading";
import { pagePaths } from "@resources/paths";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useSelector } from "@store/hooks";
import { useRouter } from "next/navigation";
import React, { forwardRef } from "react";
import Paragraph from "@modules/common/components/typography/Paragraph";
import MountainProgress from "./MountainProgress";
import ActionButton from "@modules/common/components/ActionButton";
const Growth = forwardRef<HTMLDivElement>(({}, ref) => {
  const router = useRouter();
  const currentBook = useSelector((state) => state.books.current);
  const enrollments = useSelector((state) => state.enrollments);
  return (
    <section ref={ref} className="flex flex-col items-center gap-[30px]">
      <i className="gng-mountain-progress text-[28px] py-[10] text-content" />
      <Heading variant={headingVariants.sectionHeading} sx="text-center !font-bold">
        {"Climbing the Mountain of Growth"}
      </Heading>
      <Paragraph
        content={
          "Imagine yourself at the base of a majestic mountain. Each step you take in your journal brings you closer to the peak—your highest self. Your journal includes a multi-page mountain chart starting from the left and ascending to the right."
        }
        variant={paragraphVariants.regular}
        sx="max-w-[850px] text-center"
      />
      <MountainProgress
        totalPoints={
          currentBook?.milestones?.length &&
          currentBook?.milestones.reduce((highest, current) => {
            return current.order > highest.order ? current : highest;
          }).startPoint
        }
        currentPoints={enrollments.current?.totalPoints ?? 0}
        milestones={currentBook?.milestones!}
        isLoading={enrollments.loading}
      />
      <ActionButton
        label={"View History"}
        icon={"history"}
        paragraphVariant={paragraphVariants.meta}
        onClick={() => {
          router.push(`/${currentBook?.slug}${pagePaths.history}`);
        }}
        sx={"bg-action-50 border border-border-light rounded-[10px] px-[16px] w-max"}
      />
    </section>
  );
});

export default Growth;

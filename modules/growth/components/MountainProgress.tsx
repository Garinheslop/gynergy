"use client";

import { useEffect, useState } from "react";

import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { paragraphVariants } from "@resources/variants";

import GrowthStats from "./GrowthStats";
import MountainPaths from "./MountainPaths";
import TestSvg from "../../book/components/TestSvg";

interface MountainProgressProps {
  totalPoints: number;
  currentPoints: number;
  isLoading?: boolean;
  milestones: any[];
}

export default function MountainProgress({
  totalPoints,
  currentPoints,
  milestones,
  isLoading,
}: MountainProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const firstThreshold = totalPoints * 0.1; // 10% of totalPoints
    const secondThreshold = totalPoints * 0.3; // 30% of totalPoints
    const thirdThreshold = totalPoints * 0.6; // 60% of totalPoints

    if (currentPoints <= firstThreshold) {
      setProgress((currentPoints / firstThreshold) * 29);
    } else if (currentPoints <= secondThreshold) {
      setProgress(
        29 + ((currentPoints - firstThreshold) / (secondThreshold - firstThreshold)) * (49 - 29)
      );
    } else if (currentPoints <= thirdThreshold) {
      setProgress(
        49 + ((currentPoints - secondThreshold) / (thirdThreshold - secondThreshold)) * (80 - 49)
      );
    } else {
      setProgress(
        80 + ((currentPoints - thirdThreshold) / (totalPoints - thirdThreshold)) * (100 - 80)
      );
    }
  }, [currentPoints, totalPoints]);

  // Calculate next milestone points safely

  return (
    <div className="bg-bkg-light relative h-full w-full rounded">
      <GrowthStats
        currentPoints={currentPoints}
        milestones={milestones}
        progress={progress}
        isLoading={isLoading}
        sx={"xmd:absolute left-2.5 top-2.5 lg:left-8 lg:top-8 z-10"}
      />
      <div
        className={cn(
          "xmd:flex-row bg-bkg-light relative flex w-full flex-col rounded [&>svg]:object-cover"
        )}
      >
        {milestones?.length &&
          milestones.map((milestone, index) => (
            <div
              key={index}
              className={cn("absolute flex flex-col items-center justify-center", {
                "bottom-[15%] left-[8%] sm:bottom-[5%] sm:left-[12%]": index === 0,
                "bottom-[30%] left-[34.8%] sm:bottom-[23%]": index === 1,
                "right-[35%] bottom-[40%] sm:right-[43%] sm:bottom-[39%]": index === 2,
                "top-[15%] right-[15%] sm:top-[20%] sm:right-[21%]": index === 3,
                "top-[2%] right-[5%] sm:right-[7%]": index === 4,
              })}
            >
              <Paragraph
                content={milestone.name}
                variant={paragraphVariants.regular}
                sx={cn("!font-bold md:text-[18px] text-[16px]", {
                  "card-loading text-content-dark-secondary": isLoading,
                })}
              />
              <Paragraph
                content={`${milestone.endPoint ? "" : "+"}${milestone.startPoint}${milestone.endPoint ? "-" : ""}${milestone.endPoint ?? ""} Pts`}
                variant={paragraphVariants.meta}
                sx={cn("text-content-dark-secondary xmd:flex hidden", {
                  "card-loading text-content-dark-secondary": isLoading,
                })}
              />
            </div>
          ))}
        <svg
          className="h-full w-full"
          width="1221"
          height="504"
          viewBox="0 0 1221 504"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <MountainPaths>
            <path
              className={cn(
                "stroke-action-secondary relative stroke-5 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] [stroke-linecap:round]",
                { "stroke-grey-300 card-loading": isLoading }
              )}
              d="M250 503.5L314.885 467.835C321.806 464.03 329.699 462.36 337.569 463.034L345.927 463.751C355.338 464.558 364.73 462.008 372.441 456.554L410.765 429.447C418.046 424.297 426.838 421.728 435.746 422.148L503.742 425.352C512.657 425.772 521.457 423.198 528.741 418.04L613.318 358.148C619.007 354.119 625.651 351.648 632.59 350.978L685.228 345.895C691.328 345.306 697.211 343.324 702.423 340.101L760.83 303.98C767.152 300.071 774.437 298 781.869 298H783.057C791.161 298 799.074 295.538 805.747 290.941L950.753 191.059C957.426 186.462 965.339 184 973.443 184H984.923C992.486 184 999.894 181.856 1006.29 177.817L1135 96.5"
              stroke="#D5D7DA"
              fill="none"
              strokeDasharray="1000"
              strokeDashoffset={isLoading ? 0 : 1000 - progress * 10}
            />
            <MileStones
              milestones={milestones}
              currentPoints={currentPoints}
              isLoading={isLoading}
            />
          </MountainPaths>
        </svg>
        {/* <TestSvg /> */}
      </div>
    </div>
  );
}

const MileStones = ({
  milestones,
  currentPoints,
  isLoading,
}: {
  milestones: any[];
  currentPoints: number;
  isLoading?: boolean;
}) => {
  return (
    <>
      <circle
        className={cn("fill-grey-300", {
          "fill-action-secondary": currentPoints >= milestones[0].startPoint && !isLoading,
        })}
        cx="248"
        cy="503"
        r="5"
      />
      <path
        className={cn("stroke-grey-300", {
          "stroke-action-secondary": currentPoints >= milestones[0].startPoint && !isLoading,
        })}
        d="M248.15 479V499"
        stroke-width="1.5"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        className={cn("stroke-grey-300", {
          "fill-action-secondary": currentPoints >= milestones[0].startPoint && !isLoading,
        })}
        d="M248 481H255.354C257.127 481 257.521 482 256.274 483.267L255.486 484.067C254.96 484.6 254.96 485.467 255.486 485.933L256.274 486.733C257.521 488 257.062 489 255.354 489H248"
      />
      <circle
        className={cn("fill-grey-300", {
          "fill-action-secondary": currentPoints >= milestones[1].startPoint && !isLoading,
        })}
        cx="516"
        cy="424"
        r="5"
      />
      <path
        className={cn("stroke-grey-300", {
          "stroke-action-secondary": currentPoints >= milestones[1].startPoint && !isLoading,
        })}
        d="M516.15 400V420"
        stroke-width="1.5"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        className={cn("stroke-grey-300", {
          "fill-action-secondary": currentPoints >= milestones[1].startPoint && !isLoading,
        })}
        d="M516 402H523.354C525.127 402 525.521 403 524.274 404.267L523.486 405.067C522.96 405.6 522.96 406.467 523.486 406.933L524.274 407.733C525.521 409 525.062 410 523.354 410H516"
      />
      <circle
        className={cn("fill-grey-300", {
          "fill-action-secondary": currentPoints >= milestones[2].startPoint && !isLoading,
        })}
        cx="695"
        cy="344"
        r="5"
      />
      <path
        className={cn("stroke-grey-300", {
          "stroke-action-secondary": currentPoints >= milestones[2].startPoint && !isLoading,
        })}
        d="M695.15 320V340"
        stroke-width="1.5"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        className={cn("stroke-grey-300", {
          "fill-action-secondary": currentPoints >= milestones[2].startPoint && !isLoading,
        })}
        d="M695 322H702.354C704.127 322 704.521 323 703.274 324.267L702.486 325.067C701.96 325.6 701.96 326.467 702.486 326.933L703.274 327.733C704.521 329 704.062 330 702.354 330H695"
      />
      <circle
        className={cn("fill-grey-300", {
          "fill-action-secondary": currentPoints >= milestones[3].startPoint && !isLoading,
        })}
        cx="963"
        cy="185"
        r="5"
      />
      <path
        className={cn("stroke-grey-300", {
          "stroke-action-secondary": currentPoints >= milestones[3].startPoint && !isLoading,
        })}
        d="M963.15 161V181"
        stroke-width="1.5"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        className={cn("stroke-grey-300", {
          "fill-action-secondary": currentPoints >= milestones[3].startPoint && !isLoading,
        })}
        d="M963 163H970.354C972.127 163 972.521 164 971.274 165.267L970.486 166.067C969.96 166.6 969.96 167.467 970.486 167.933L971.274 168.733C972.521 170 972.062 171 970.354 171H963"
      />
      <circle
        className={cn("fill-grey-300", {
          "fill-action-secondary": currentPoints >= milestones[4].startPoint && !isLoading,
        })}
        cx="1136"
        cy="96"
        r="5"
      />
      <path
        className={cn("stroke-grey-300", {
          "stroke-action-secondary": currentPoints >= milestones[4].startPoint && !isLoading,
        })}
        d="M1135.67 65.4546V94.5455"
        stroke-width="1.5"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        className={cn("stroke-grey-300", {
          "fill-action-secondary": currentPoints >= milestones[4].startPoint && !isLoading,
        })}
        d="M1135.45 68.3638H1146.15C1148.73 68.3638 1149.3 69.8183 1147.49 71.6607L1146.34 72.8244C1145.58 73.6001 1145.58 74.8607 1146.34 75.5395L1147.49 76.7032C1149.3 78.5456 1148.64 80.0001 1146.15 80.0001H1135.45"
      />
    </>
  );
};

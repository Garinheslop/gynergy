"use client";

import { useState } from "react";

import { useSelector } from "react-redux";

import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import Image from "@modules/common/components/Image";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import VideoPlayback from "@modules/common/components/VideoPlayback";
import images from "@resources/images";
import { buttonActionTypes } from "@resources/types/button";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { RootState } from "@store/configureStore";
import { useDispatch } from "@store/hooks";
import { enrollUserToBookSession } from "@store/modules/enrollment";

import Inspiration from "./Inspiration";
import PotentialSelf from "./PotentialSelf";

const BookOnboarding = () => {
  const [step, setStep] = useState(1);
  const dispatch = useDispatch();

  const book = useSelector((state: RootState) => state.books.current);
  return (
    <section className="bg-bkg-light mx-auto flex max-w-[1200px] flex-col items-center gap-[30px] rounded-[20px] p-[20px] pb-[20px] md:gap-[40px] md:p-[50px] md:pb-[30px]">
      {step > 1 && (
        <ActionButton
          label={"Back"}
          icon="arrow-left"
          buttonActionType={buttonActionTypes.text}
          onClick={() => setStep((prev) => prev - 1)}
          sx="w-max flex-row-reverse mr-auto sm:hidden flex"
        />
      )}
      {step === 1 && <BookDetails />}
      {step === 2 && <AppDetails />}
      {step === 3 && <Inspiration />}
      {step === 4 && <PotentialSelf />}
      <div className="border-border-light flex w-full grid-cols-3 flex-col gap-[20px] border-t pt-[20px] sm:grid md:pt-[30px]">
        <div className="flex items-center">
          {step > 1 && (
            <ActionButton
              label={"Back"}
              icon="arrow-left"
              buttonActionType={buttonActionTypes.text}
              onClick={() => setStep((prev) => prev - 1)}
              sx="w-max mr-auto hidden md:flex"
            />
          )}
        </div>
        <div className="mx-auto flex items-center gap-[10px]">
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className={cn(
                "bg-grey-300 h-[10px] w-[10px] cursor-pointer rounded-full duration-200",
                {
                  "bg-dark-pure w-[30px] rounded-[20px]": step === index + 1,
                }
              )}
              onClick={() => setStep(index + 1)}
            />
          ))}
        </div>
        <ActionButton
          label={step === 4 ? `Start ${book?.shortName}` : "Next"}
          icon="arrow-right"
          onClick={() => {
            if (step === 4) {
              dispatch(enrollUserToBookSession(book?.id!));
            } else {
              setStep((prev) => prev + 1);
            }
          }}
          sx="w-full sm:w-max ml-auto flex-row-reverse"
        />
      </div>
    </section>
  );
};

const BookDetails = () => {
  const book = useSelector((state: RootState) => state.books.current);
  return (
    <>
      <Heading
        isHtml
        variant={headingVariants.heading}
        sx="text-center mx-auto [&>h1>span]:!font-bold"
      >
        {book?.heading}
      </Heading>
      <Paragraph
        content={`Duration: ${book?.durationDays} Days`}
        variant={paragraphVariants.titleLg}
        sx="font-bold"
      />
      <div className="border-border-light flex w-full border-t" />
      <div className="grid gap-[30px] md:grid-cols-[1fr_400px] md:gap-[40px]">
        <Paragraph
          isHtml
          content={book?.description}
          variant={paragraphVariants.regular}
          sx="flex flex-col gap-[5px] text-content-dark-secondary [&>p>a]:!text-action-400 [&>p>a]:hover:!text-action-900"
        />
        <Image className="h-auto w-full rounded-[20px]" path={book?.cover} />
      </div>
    </>
  );
};

const AppDetails = () => {
  const appDescription = `
    <p>This App helps you define your highest aspirations and long-term goals. Craft a clear and inspiring vision for your life that reflects your deepest values and desires. Use this space to visualize the person you want to become and the life you wish to lead. Revisit your vision regularly to stay aligned with your journey of growth and gratitude.</p>
    <p></p>
    <p></p>
    <p></p>
    <p><span>Daily Actions:</span> Start your day with morning gratitude prompts and set your intentions. In the evening, reflect on your day, celebrate your successes, and identify areas for improvement.</p>
    <p><span>Weekly Reflections:</span> At the end of each week, take time to review your achievements, overcome challenges, and lessons learned.</p>
    <p><span>Monthly Reflections:</span> Every 30 days, dive deeper into your progress, personal growth, and set new goals.</p>
    <p><span>Incorporate Photos:</span> Personalize your journal by adding photos that capture moments of gratitude and joy.</p>
    <p><span>Earn Points and Rewards:</span> Stay motivated with our points system and enjoy the rewards for your dedication and progress.</p>
  `;

  const features = [
    {
      name: "Track Your Progress",
      description:
        "See your achievements and stay inspired on your path to personal growth. Track your progress and celebrate your wins.",
      icon: "task-square",
    },
    {
      name: "OCR: Capture Every Thought ",
      description:
        "Preserve your handwritten insights. Use OCR to digitize your journal entries and keep your thoughts organized and accessible from anywhere.",
      icon: "scan",
    },
    {
      name: "Compete & Rise",
      description:
        "Compete for top ranking on the Gynergy Community leaderboard and unlock exclusive rewards. Be recognized for your achievements.",
      icon: "crown",
    },
  ];
  return (
    <>
      <Heading isHtml variant={headingVariants.heading} sx="text-center mx-auto capitalize">
        How to Journal with this app
      </Heading>
      <div className="border-border-light flex w-full border-t" />
      <Paragraph
        isHtml
        content={appDescription}
        variant={paragraphVariants.regular}
        sx="flex flex-col gap-[5px] [&>p>span]:!font-bold text-content-dark-secondary"
      />
      <div className="xmd:grid-cols-3 grid w-full grid-cols-1 gap-[10px] sm:grid-cols-2">
        {features.map((feature, index) => (
          <div
            key={index}
            className="border-border-light flex flex-col gap-[10px] rounded border p-5"
          >
            <div className="bg-grey-50 border-grey-100 mx-auto flex h-[80px] w-[80px] items-center justify-center rounded border">
              <i className={`gng-${feature.icon} text-[34px]`} />
            </div>
            <Paragraph
              content={feature.name}
              variant={paragraphVariants.regular}
              sx="!font-bold text-center"
            />
            <Paragraph
              content={feature.description}
              variant={paragraphVariants.regular}
              sx="text-content-dark-secondary text-center"
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default BookOnboarding;

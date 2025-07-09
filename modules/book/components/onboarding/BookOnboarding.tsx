"use client";

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
import { useState } from "react";
import { useSelector } from "react-redux";
import Inspiration from "./Inspiration";
import PotentialSelf from "./PotentialSelf";

const BookOnboarding = () => {
  const [step, setStep] = useState(1);
  const dispatch = useDispatch();

  const book = useSelector((state: RootState) => state.books.current);
  return (
    <section className="flex flex-col items-center gap-[30px] md:gap-[40px] max-w-[1200px] p-[20px] md:p-[50px] pb-[20px] md:pb-[30px] bg-bkg-light rounded-[20px] mx-auto">
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
      <div className="flex flex-col gap-[20px] sm:grid grid-cols-3 w-full border-t border-border-light pt-[20px] md:pt-[30px]">
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
        <div className="flex gap-[10px] items-center mx-auto">
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className={cn(
                "w-[10px] h-[10px] rounded-full bg-grey-300 duration-200 cursor-pointer",
                {
                  "w-[30px] bg-dark-pure rounded-[20px]": step === index + 1,
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
      <div className="flex w-full border-t border-border-light" />
      <div className="grid md:grid-cols-[1fr_400px] gap-[30px] md:gap-[40px]">
        <Paragraph
          isHtml
          content={book?.description}
          variant={paragraphVariants.regular}
          sx="flex flex-col gap-[5px] text-content-dark-secondary [&>p>a]:!text-action-400 [&>p>a]:hover:!text-action-900"
        />
        <Image className="w-full h-auto rounded-[20px]" path={book?.cover} />
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
      <div className="flex w-full border-t border-border-light" />
      <Paragraph
        isHtml
        content={appDescription}
        variant={paragraphVariants.regular}
        sx="flex flex-col gap-[5px] [&>p>span]:!font-bold text-content-dark-secondary"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xmd:grid-cols-3 w-full gap-[10px]">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex flex-col gap-[10px] p-5 border border-border-light rounded"
          >
            <div className="rounded flex justify-center items-center w-[80px] h-[80px] bg-grey-50 border border-grey-100 mx-auto">
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

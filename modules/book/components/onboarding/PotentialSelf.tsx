import Image from "@modules/common/components/Image";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import VideoPlayback from "@modules/common/components/VideoPlayback";
import images from "@resources/images";
import { headingVariants, paragraphVariants } from "@resources/variants";

const PotentialSelf = () => {
  return (
    <>
      <Heading
        isHtml
        variant={headingVariants.heading}
        sx="text-center mx-auto [&>h1>span]:!font-bold"
      >
        Meeting Your Highest Potential Self
      </Heading>
      <div className="border-border-light flex w-full border-t" />
      <div className="flex flex-col gap-8 md:gap-10">
        <div className="flex flex-col gap-5">
          <Paragraph
            content={`Welcome to your journey of self-discovery and transformation. Begin by finding a quiet, comfortable place where you won't be disturbed. Sit or lie down, close your eyes, and take a few deep breaths to center yourself. Watch the video below:`}
            variant={paragraphVariants.regular}
            sx="flex flex-col gap-5 text-content-dark-secondary"
          />
          <VideoPlayback url="https://www.youtube.com/embed/12zcgmmE_Aw?si=IfJHdPvviasJty0t" />
        </div>

        <div className="flex flex-col gap-2.5">
          <Paragraph
            content={"Alternatively, if you’re not into videos, you can follow along below:"}
            variant={paragraphVariants.regular}
            sx="flex flex-col gap-5 text-content-dark-secondary font-bold"
          />
          <ol className="flex flex-col gap-2.5 [&>li]:flex [&>li]:items-start [&>li]:gap-1">
            <li>
              <Paragraph
                content={"1."}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary font-bold"
              />
              <Paragraph
                isHtml
                content={`<span>Settle into the Moment:</span> Close your eyes and take a deep breath in, feeling the air fill your lungs. Slowly exhale, releasing any tension or stress. Repeat this a few times until you feel calm and centered.`}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary [&>span]:font-bold"
              />
            </li>
            <li>
              <Paragraph
                content={"2."}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary font-bold"
              />
              <Paragraph
                isHtml
                content={`<span>Visualize Your Safe Space:</span> Imagine a peaceful place where you feel completely safe and at ease. This could be a real location or a place from your imagination. Take a few moments to fully immerse yourself in this environment, noticing the details, sounds, and sensations.`}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary [&>span]:font-bold"
              />
            </li>
            <li>
              <Paragraph
                content={"3."}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary font-bold"
              />
              <Paragraph
                isHtml
                content={`<span>Meet Your Highest Potential Self:</span> Now, envision a figure approaching you in this safe space. This is your highest potential self. They embody everything you aspire to be and possess all the qualities you admire. Observe their demeanor, confidence, and the aura of calm and purpose they exude.`}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary [&>span]:font-bold"
              />
            </li>
            <li>
              <Paragraph
                content={"4."}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary font-bold"
              />
              <Paragraph
                isHtml
                content={`<span>Engage in a Dialogue:</span> Spend some time communicating with your highest potential self. Ask them questions about how they handle challenges, what drives them, and what advice they have for you. Listen to their wisdom and guidance.`}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary [&>span]:font-bold"
              />
            </li>
            <li>
              <Paragraph
                content={"5."}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary font-bold"
              />
              <Paragraph
                isHtml
                content={`<span>Absorb Their Energy:</span> Imagine yourself merging with your highest potential self, absorbing their strength, wisdom, and positive energy. Feel this energy filling you up, empowering you to step into your full potential.`}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary [&>span]:font-bold"
              />
            </li>
            <li>
              <Paragraph
                content={"6."}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary font-bold"
              />
              <Paragraph
                isHtml
                content={`<span>Return to the Present:</span> When you're ready, slowly bring your awareness back to your current surroundings. Open your eyes and take a moment to reflect on the experience.`}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary [&>span]:font-bold"
              />
            </li>
          </ol>
        </div>
      </div>
    </>
  );
};
export default PotentialSelf;

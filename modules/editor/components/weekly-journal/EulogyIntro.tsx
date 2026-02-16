import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { headingVariants } from "@resources/variants";

const EulogyIntro = () => {
  return (
    <>
      <div className="flex flex-col gap-2.5">
        <Heading variant={headingVariants.title} sx="!font-bold">
          Set Aside Time:
        </Heading>
        <Paragraph
          content={
            "Find a quiet space where you can reflect without interruptions. Dedicate at least 30 minutes to an hour to this exercise so you can fully immerse yourself in the process."
          }
          sx="text-content-dark-secondary"
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <Heading variant={headingVariants.title} sx="!font-bold">
          Reflect on Key Life Areas:
        </Heading>
        <Paragraph
          content={
            "Relationships: How do you want to be remembered in your relationships with family, friends, and others? What qualities did you bring to these connections, and how did you show love, support, and kindness?"
          }
          sx="text-content-dark-secondary"
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <Heading variant={headingVariants.title} sx="!font-bold">
          Contribution:
        </Heading>
        <Paragraph
          content={
            "Think about the difference you made in the world. How did you use your passions, skills, and time to positively impact others? What causes or communities were you devoted to?"
          }
          sx="text-content-dark-secondary"
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <Heading variant={headingVariants.title} sx="!font-bold">
          Personal Growth:
        </Heading>
        <Paragraph
          content={
            "What values guided your life? How did you embody resilience, integrity, and a commitment to self-improvement? What did you strive to achieve in your personal growth journey?"
          }
          sx="text-content-dark-secondary"
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <Heading variant={headingVariants.title} sx="!font-bold">
          Write Your Eulogy:
        </Heading>
        <Paragraph
          content={
            "Opening: Start by setting the scene. Picture a gathering of the people who mattered most to you. Imagine them sharing stories about your life. What would they say? How did your presence touch their lives?"
          }
          sx="text-content-dark-secondary"
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <Heading variant={headingVariants.title} sx="!font-bold">
          Key Themes:
        </Heading>
        <Paragraph
          content={
            "Focus on the areas of life that matter most to you (relationships, contribution, personal growth). Share specific examples that embody the person you aspire to be and the impact you aim to make."
          }
          sx="text-content-dark-secondary"
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <Heading variant={headingVariants.title} sx="!font-bold">
          Closing Thoughts:
        </Heading>
        <Paragraph
          content={
            "End your eulogy with the message you hope to leave behind. What do you want others to take away from your life story? What legacy do you wish to leave?"
          }
          sx="text-content-dark-secondary"
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <Heading variant={headingVariants.title} sx="!font-bold">
          Reflect on the Exercise:
        </Heading>
        <Paragraph
          content={
            "After writing your eulogy, spend time reflecting on the alignment between your current life and the person you described. Are there areas where you can grow or make changes to live more authentically? Write down three specific actions you can take to bring your current life closer to your ideal vision."
          }
          sx="text-content-dark-secondary"
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <Heading variant={headingVariants.title} sx="!font-bold">
          Optional Visualization:
        </Heading>
        <Paragraph
          content={
            "Before starting to write, close your eyes and visualize the scene of your eulogy. Imagine the emotions, the people present, and the stories they share. Let this visualization guide you as you connect deeply with the exercise."
          }
          sx="text-content-dark-secondary"
        />
      </div>
    </>
  );
};

export default EulogyIntro;

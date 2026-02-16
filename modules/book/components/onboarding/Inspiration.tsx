import Image from "@modules/common/components/Image";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import images from "@resources/images";
import { headingVariants, paragraphVariants } from "@resources/variants";

const Inspiration = () => {
  const description = `<p>As we embark on this journey of self-discovery and transformation, we want to take a moment to express our deepest gratitude to the thinkers, authors, and visionaries who have profoundly influenced our lives and the creation of this journal. Their wisdom has been a guiding light, shaping the principles and practices within these pages.</p><p><span>Looking Ahead</span>Date Zero is just the beginning. As you progress through this journal, you will lay the groundwork for future growth. We are committed to supporting your journey with additional journals and courses that build on the foundation you are creating today. Stay connected with us for updates and new resources designed to help you continue thriving.</p>`;
  return (
    <>
      <Heading
        isHtml
        variant={headingVariants.heading}
        sx="text-center mx-auto [&>h1>span]:!font-bold"
      >
        Inspiration and Gratitude
      </Heading>
      <div className="border-border-light flex w-full border-t" />
      <div className="grid items-center gap-8 md:grid-cols-[540px_1fr] md:gap-10">
        <Image className="h-auto w-full rounded-large" src={images.inspirationGratitude} />
        <Paragraph
          isHtml
          content={description}
          variant={paragraphVariants.regular}
          sx="flex flex-col gap-5 text-content-dark-secondary [&>p>span]:!font-bold [&>p]:flex [&>p]:flex-col [&>p]:gap-2.5"
        />
      </div>
    </>
  );
};

export default Inspiration;

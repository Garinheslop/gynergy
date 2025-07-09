import { cn } from "@lib/utils/style";
import { headingVariants } from "@resources/variants";

// --text-heading: 3rem; /* 48px dp xl*/
// --text-section-heading: 3rem; /* 48px dp xl*/
// --text-title: 1.875rem; /* 30px dp sm*/
// --text-card-heading-lg: 2.25rem; /* 36px dp lg*/
// --text-card-heading: 1.875rem; /* 30px dp sm*/
// --text-title: 1.5rem; /* 24px - dp xs*/
// --text-body: 1.125; /* 18px */
// --text-body-sm: 1rem; /* 16px */

const useGetHeadingVariant = ({
  variant,
  sx,
}: {
  variant: (typeof headingVariants)[keyof typeof headingVariants];
  sx: string;
}) => {
  const headingVariantStyles = {
    [headingVariants.heading]: {
      componentStyle: cn(
        "text-[28px] md:text-[36px] lg:text-[40px] xl:text-heading my-0 [&>span]:text-primary text-content-dark tracking-tight leading-[1.2em] ",
        sx
      ),
      Element: "h1",
    },
    [headingVariants.sectionHeading]: {
      componentStyle: cn(
        "text-[28px] md:text-[36px] lg:text-[40px] xl:text-heading my-0 [&>span]:text-primary text-content-dark leading-[1.2em] capitalize",
        sx
      ),
      Element: "h2",
    },
    [headingVariants.titleLg]: {
      componentStyle: cn(
        "text-[26px] md:text-[28px] lg:text-[30px] xl:text-card-heading-lg my-0 [&>span]:text-primary text-content-dark leading-[1.2em] capitalize",
        sx
      ),
      Element: "h2",
    },
    [headingVariants.cardHeading]: {
      componentStyle: cn(
        "text-[24px] leading-[1em] md:text-[28px] lg:text-card-heading my-0 [&>span]:text-primary text-content-dark capitalize",
        sx
      ),
      Element: "h3",
    },
    [headingVariants.title]: {
      componentStyle: cn(
        "text-[22px] leading-[1em] md:text-title my-0 [&>span]:text-primary text-content-dark capitalize",
        sx
      ),
      Element: "h3",
    },
  };

  return headingVariantStyles[variant];
};
export default useGetHeadingVariant;

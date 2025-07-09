import { cn } from "@lib/utils/style";
import { paragraphVariants } from "@resources/variants";

// --text-heading: 3rem; /* 48px dp xl*/
// --text-section-heading: 3rem; /* 48px dp xl*/
// --text-title-lg: 1.875rem; /* 30px dp sm*/
// --text-card-heading-lg: 2.25rem; /* 36px dp lg*/
// --text-card-heading: 1.875rem; /* 30px dp sm*/
// --text-title: 1.5rem; /* 24px - dp xs*/
// --text-body: 1.125; /* 18px */
// --text-body-sm: 1rem; /* 16px */

const useGetParagraphVariant = ({
  variant,
  sx,
}: {
  variant: (typeof paragraphVariants)[keyof typeof paragraphVariants];
  sx: string;
}) => {
  let paragraphStyles = {
    [paragraphVariants.title]: cn(
      "text-[20px] md:text-title text-content-dark leading-[1.2em] ",
      sx
    ),
    [paragraphVariants.titleLg]: cn(
      "text-[1.5rem] sm:text-[28px] lg:text-title-lg text-content-dark leading-[1.2em] ",
      sx
    ),
    [paragraphVariants.titleXlg]: cn(
      "text-[28px] md:text-[36px] lg:text-[40px] xl:text-heading my-0 text-content-dark tracking-tight capitalize",
      sx
    ),
    [paragraphVariants.regular]: cn(
      "text-[1.125rem] text-content-dark leading-[1.4em] [&>ul>li>p]:text-[18px]",
      sx
    ),
    [paragraphVariants.meta]: cn("text-body-sm text-dark-lighter text-content-dark", sx),
  };

  return paragraphStyles[variant];
};
export default useGetParagraphVariant;

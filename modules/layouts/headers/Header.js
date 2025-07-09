import { cn } from "@lib/utils/style";
import Heading from "@modules/common/components/typography/Heading";
import { headingVariants } from "@resources/variants";

const Header = ({
  heading,
  onClick,
  headingVariant = headingVariants.cardHeading,
  isLoading,
  sx,
}) => {
  return (
    <header className={cn("flex items-center justify-start px-2 py-4 sm:p-4", sx)}>
      {onClick && (
        <button
          className="absolute flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-bkg-light-secondary sm:relative"
          onClick={() => onClick()}
        >
          <i className="djc-arrow-left-thin1 text-xs text-content-light-reverse" />
        </button>
      )}
      <Heading variant={headingVariant} sx={cn("font-bold", { "ml-4": onClick })}>
        {!isLoading ? (
          heading
        ) : (
          <div className="skeleton-loading h-7 w-44 max-w-[50%] rounded bg-meta-secondary" />
        )}
      </Heading>
    </header>
  );
};

export default Header;

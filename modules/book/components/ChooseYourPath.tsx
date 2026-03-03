import { cn } from "@lib/utils/style";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useSelector } from "@store/hooks";

interface PathOption {
  title: string;
  price: string;
  description: string;
  targetGender: "male" | "female";
  checkoutSlug: string;
}

const PATHS: PathOption[] = [
  {
    title: "LVL 5 LIFE",
    price: "$97/mo",
    description:
      "The elite mastermind for men committed to mastery across all five pillars. Weekly coaching, brotherhood accountability, and advanced curriculum.",
    targetGender: "male",
    checkoutSlug: "lvl5-community",
  },
  {
    title: "Fit & Feminine",
    price: "$127/mo",
    description:
      "The premium community for women pursuing holistic wellness. Expert coaching, sisterhood support, and curated programming.",
    targetGender: "female",
    checkoutSlug: "fit-feminine",
  },
];

const ChooseYourPath = () => {
  const profile = useSelector((state) => state.profile.current);
  const userGender = profile?.gender;

  const buildCheckoutUrl = (slug: string) => {
    const params = new URLSearchParams({
      utm_source: "portal",
    });
    if (profile?.email) params.set("email", profile.email);
    if (profile?.id) params.set("ref", profile.id);
    return `https://lvl5life.com/payment?plan=${slug}&${params.toString()}`;
  };

  // Show both paths if gender not set; otherwise show matching first, then other
  const sortedPaths =
    userGender === "male" || userGender === "female"
      ? [...PATHS].sort((a, b) =>
          a.targetGender === userGender ? -1 : b.targetGender === userGender ? 1 : 0
        )
      : PATHS;

  return (
    <section className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <Heading variant={headingVariants.sectionHeading} sx="!font-bold">
          Choose Your Path
        </Heading>
        <Paragraph
          content="Your 45-day transformation is complete. Continue your growth with a community built for you."
          variant={paragraphVariants.regular}
          sx="text-content-dark-secondary max-w-[600px]"
        />
      </div>

      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
        {sortedPaths.map((path) => {
          const isRecommended = userGender && path.targetGender === userGender;

          return (
            <div
              key={path.checkoutSlug}
              className={cn("bg-bkg-light rounded-large relative flex flex-col gap-4 p-6 md:p-8", {
                "ring-action-600 ring-2": isRecommended,
              })}
            >
              {isRecommended && (
                <span className="bg-action-600 absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold text-white">
                  Recommended for you
                </span>
              )}

              <div className="flex items-baseline justify-between gap-3">
                <Heading variant={headingVariants.title} sx="!font-bold">
                  {path.title}
                </Heading>
                <span className="text-action-600 text-lg font-bold whitespace-nowrap">
                  {path.price}
                </span>
              </div>

              <Paragraph
                content={path.description}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary"
              />

              <a
                href={buildCheckoutUrl(path.checkoutSlug)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-action-600 hover:bg-action-700 mt-auto inline-block rounded-lg px-6 py-3 text-center text-sm font-semibold text-white transition-colors"
              >
                Learn More
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ChooseYourPath;

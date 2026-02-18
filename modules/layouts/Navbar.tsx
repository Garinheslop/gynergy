"use client";

import React, { FC, useEffect, useCallback } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useSession } from "@contexts/UseSession";
import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import Image from "@modules/common/components/Image";
import NotificationBell from "@modules/common/components/NotificationBell";
import Paragraph from "@modules/common/components/typography/Paragraph";
import TransitionWrapper from "@modules/common/components/wrappers/TransitionWrapper";
import useComponentVisible from "@modules/common/hooks/useComponentVisible";
import icons from "@resources/icons";
import images from "@resources/images";
import { pagePaths } from "@resources/paths";
import { paragraphVariants } from "@resources/variants";
import { RootState } from "@store/configureStore";
import { useSelector } from "@store/hooks";

const Navbar: FC = () => {
  const { session } = useSession();
  const router = useRouter();
  const path = usePathname();

  const currentBook = useSelector((state) => state.books.current);

  if (!session?.user || path === "/") {
    return null;
  }
  return (
    <nav
      className={cn(
        "border-border-light bg-bkg-light text-light z-sticky fixed h-[70px] w-full items-center justify-between border-b px-5"
      )}
    >
      <section className="mx-auto flex w-full max-w-[1256px] items-center justify-between px-4 py-2.5">
        <Link href={`/${currentBook?.slug ?? "/"}`} className="flex items-center gap-1">
          <Image className="h-10 w-auto" src={icons.dateZeroLogo} alt="date-zero-logo" />
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-5">
            <ActionButton
              label={"Community"}
              icon={"people"}
              paragraphVariant={paragraphVariants.meta}
              onClick={() => {
                router.push("/community");
              }}
              sx={
                "bg-action-50 border border-border-light rounded px-2.5 flex-row-reverse hidden sm:flex"
              }
            />
            <ActionButton
              label={"Journaling History"}
              icon={"journal"}
              paragraphVariant={paragraphVariants.meta}
              onClick={() => {
                router.push(`/${currentBook?.slug}/${pagePaths.history}`);
              }}
              sx={
                "bg-action-50 border border-border-light rounded px-2.5 flex-row-reverse hidden sm:flex"
              }
            />
            <NotificationBell />
            <DropdownMenu />
          </div>
        ) : (
          <>
            {path !== "/" && (
              <ActionButton
                label={"Sign In"}
                paragraphVariant={paragraphVariants.meta}
                onClick={() => {}}
                sx={"bg-action-50 border border-border-light rounded px-2.5 w-max"}
              />
            )}
          </>
        )}
      </section>
    </nav>
  );
};

export default Navbar;

const DropdownMenu: FC = () => {
  const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible<HTMLDivElement>(false);
  const currentProfile = useSelector((state: RootState) => state.profile.current);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isComponentVisible) {
        setIsComponentVisible(false);
      }
    };

    if (isComponentVisible) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll on mobile when menu is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isComponentVisible, setIsComponentVisible]);

  const closeMenu = useCallback(() => {
    setIsComponentVisible(false);
  }, [setIsComponentVisible]);

  return (
    <div className={cn("group relative shrink-0")} ref={ref}>
      <button
        className="group focus-visible:ring-action-500 relative flex shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        onClick={() => {
          setIsComponentVisible(!isComponentVisible);
        }}
        aria-expanded={isComponentVisible}
        aria-haspopup="true"
        aria-label="Open user menu"
      >
        <Image
          className="border-dark-pure group-hover:border-action-secondary h-[50px] w-[50px] shrink-0 rounded-full border-2 object-cover duration-300"
          path={currentProfile?.profileImage}
          onErrorImage={images.placeholders.profileImage}
          alt={"Profile Image"}
        />
        <div className="bg-dark-pure border-dark-pure group-hover:border-action-secondary absolute right-[1px] bottom-[1px] flex h-5 w-5 items-center justify-center rounded-full border duration-300">
          <i className="gng-arrow-down-thin text-action-secondary text-[10px]" />
        </div>
      </button>

      {/* Mobile backdrop */}
      {isComponentVisible && (
        <div
          className="z-modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm sm:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <TransitionWrapper
        isOpen={isComponentVisible}
        sx={cn(
          "z-modal",
          // Mobile: slide-up drawer from bottom
          "fixed bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl",
          // Desktop: dropdown menu
          "sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-[65px] sm:w-max sm:min-w-[370px] sm:max-h-none sm:rounded-lg sm:overflow-visible"
        )}
      >
        <UserMenuItems onItemClick={closeMenu} />
      </TransitionWrapper>
    </div>
  );
};

interface UserMenuItemsProps {
  onItemClick: () => void;
}
const UserMenuItems: FC<UserMenuItemsProps> = ({ onItemClick }) => {
  const router = useRouter();
  const { logout } = useSession();
  const currentBook = useSelector((state) => state.books.current);
  const userEnrollment = useSelector((state) => state.enrollments.current);
  const currentProfile = useSelector((state: RootState) => state.profile.current);
  return (
    <ul className="bg-bkg-light border-border-light [&>li]:hover:[&>i]:text-action-secondary relative flex h-full w-full flex-col items-start gap-5 overflow-hidden rounded-t-2xl border px-8 py-[20px] pb-[env(safe-area-inset-bottom,20px)] sm:justify-between sm:gap-0 sm:rounded sm:pb-[20px] [&>li]:w-full [&>li]:hover:[&>i]:mr-[2px] [&>li>i]:duration-150">
      {/* Mobile close indicator */}
      <li className="flex w-full justify-center pb-2 sm:hidden">
        <div className="h-1 w-12 rounded-full bg-gray-300" />
      </li>
      <li className="flex items-center gap-2.5">
        <Image
          className="border-dark-pure h-[50px] w-[50px] shrink-0 rounded-full border-2 object-cover"
          onErrorImage={images.placeholders.profileImage}
          path={currentProfile?.profileImage}
          alt={"Profile Image"}
        />
        <Paragraph
          variant={paragraphVariants.regular}
          content={currentProfile?.firstName}
          sx={"text-content-dark"}
        />
      </li>
      <li className="flex items-center gap-[16px]">
        <div className="flex items-center gap-2.5">
          <Image src={icons.point} className="h-[25px] w-auto" alt="Points" />
          <Paragraph
            variant={paragraphVariants.regular}
            content={userEnrollment?.totalPoints}
            sx={"text-content-dark"}
          />
        </div>
        <div className="flex items-center gap-2.5">
          <Image src={icons.streak} className="h-[25px] w-auto" alt="Streak" />
          <Paragraph
            variant={paragraphVariants.regular}
            content={Math.max(
              userEnrollment?.morningStreak ?? 0,
              userEnrollment?.eveningStreak ?? 0,
              userEnrollment?.gratitudeStreak ?? 0
            )}
            sx={"text-content-dark"}
          />
        </div>
      </li>
      <div className="border-border-light w-full border-b" />
      <li
        role="button"
        tabIndex={0}
        className="hover:bg-bkg-dark/10 flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded py-2 sm:hidden"
        onClick={() => {
          router.push(`${currentBook?.slug}/${pagePaths.history}`);
          onItemClick();
        }}
        onKeyDown={(e) =>
          e.key === "Enter" && router.push(`${currentBook?.slug}/${pagePaths.history}`)
        }
      >
        <i className="gng-journal text-content-secondary text-xl" />
        <Paragraph
          variant={paragraphVariants.regular}
          content={"Journaling History"}
          sx={"text-content-dark"}
        />
      </li>
      <li
        role="button"
        tabIndex={0}
        className="hover:bg-bkg-dark/10 flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded py-2 sm:hidden"
        onClick={() => {
          router.push("/community");
          onItemClick();
        }}
        onKeyDown={(e) => e.key === "Enter" && router.push("/community")}
      >
        <i className="gng-people text-content-secondary text-xl" />
        <Paragraph
          variant={paragraphVariants.regular}
          content={"Community"}
          sx={"text-content-dark"}
        />
      </li>
      <li
        role="button"
        tabIndex={0}
        className="hover:bg-bkg-dark/10 flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded py-2"
        onClick={() => {
          router.push(`/${currentBook?.slug}/${pagePaths.settings}`);
          onItemClick();
        }}
        onKeyDown={(e) =>
          e.key === "Enter" && router.push(`/${currentBook?.slug}/${pagePaths.settings}`)
        }
      >
        <i className="gng-settings text-content-secondary text-xl" />
        <Paragraph
          variant={paragraphVariants.regular}
          content={"Settings"}
          sx={"text-content-dark"}
        />
      </li>
      <li
        role="button"
        tabIndex={0}
        className="hover:bg-bkg-dark/10 flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded py-2"
        onClick={() => {
          window.open(
            "mailto:bitechxconnect+kojwp6mtw4hinjw7vdoe@boards.trello.com",
            "_blank",
            "noopener,noreferrer"
          );
          onItemClick();
        }}
        onKeyDown={(e) =>
          e.key === "Enter" &&
          window.open(
            "mailto:bitechxconnect+kojwp6mtw4hinjw7vdoe@boards.trello.com",
            "_blank",
            "noopener,noreferrer"
          )
        }
      >
        <i className="gng-alert text-content-secondary text-xl" />
        <Paragraph
          variant={paragraphVariants.regular}
          content={"Report A Bug"}
          sx={"text-content-dark"}
        />
      </li>
      <li
        role="button"
        tabIndex={0}
        className="hover:bg-bkg-dark/10 flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded py-2"
        onClick={() => {
          logout();
          onItemClick();
        }}
        onKeyDown={(e) => e.key === "Enter" && logout()}
      >
        <i className="gng-sign-out text-content-secondary text-xl" />
        <Paragraph
          variant={paragraphVariants.regular}
          content={"Sign Out"}
          sx={"text-content-dark"}
        />
      </li>
    </ul>
  );
};

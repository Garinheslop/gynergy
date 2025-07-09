"use client";

import React, { FC } from "react";
import { usePathname, useRouter } from "next/navigation";
import { pagePaths } from "@resources/paths";
import Link from "next/link";
import icons from "@resources/icons";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { paragraphVariants } from "@resources/variants";
import ActionButton from "@modules/common/components/ActionButton";
import { useSession } from "@contexts/UseSession";
import { cn } from "@lib/utils/style";
import useComponentVisible from "@modules/common/hooks/useComponentVisible";
import TransitionWrapper from "@modules/common/components/wrappers/TransitionWrapper";
import Image from "@modules/common/components/Image";
import { RootState } from "@store/configureStore";
import { useSelector } from "@store/hooks";
import images from "@resources/images";

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
        "z-[1001] fixed h-[70px] w-full items-center justify-between border-b border-border-light bg-bkg-light px-5 text-light"
      )}
    >
      <section className="py-[10px] mx-auto max-w-[1256px] flex justify-between items-center px-4 w-full">
        <Link href={`/${currentBook?.slug ?? "/"}`} className="flex items-center gap-[5px]">
          <Image className="h-[40px] w-auto" src={icons.dateZeroLogo} alt="date-zero-logo" />
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-5">
            <ActionButton
              label={"Join Gynergy Community"}
              icon={"people"}
              paragraphVariant={paragraphVariants.meta}
              onClick={() => {
                window.open(
                  "https://glxu7q1mylasl0ssnlqn.app.clientclub.net",
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
              sx={
                "bg-action-50 border border-border-light rounded-[10px] px-[10px] flex-row-reverse hidden sm:flex"
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
                "bg-action-50 border border-border-light rounded-[10px] px-[10px] flex-row-reverse hidden sm:flex"
              }
            />
            <DropdownMenu />
          </div>
        ) : (
          <>
            {path !== "/" && (
              <ActionButton
                label={"Sign In"}
                paragraphVariant={paragraphVariants.meta}
                onClick={() => {}}
                sx={"bg-action-50 border border-border-light rounded-[10px] px-[10px] w-max"}
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
  return (
    <div className={cn("relative group shrink-0")} ref={ref}>
      <button
        className="relative flex justify-center items-center shrink-0 cursor-pointer group"
        onClick={() => {
          setIsComponentVisible(!isComponentVisible);
        }}
      >
        <Image
          className="shrink-0 w-[50px] h-[50px] rounded-full object-cover border-2 border-dark-pure group-hover:border-action-secondary duration-300"
          path={currentProfile?.profileImage}
          onErrorImage={images.placeholders.profileImage}
          alt={"Profile Image"}
        />
        <div className="absolute bottom-[1px] right-[1px] flex h-[20px] w-[20px] rounded-full justify-center items-center bg-dark-pure border border-dark-pure group-hover:border-action-secondary duration-300">
          <i className="gng-arrow-down-thin text-action-secondary text-[10px]" />
        </div>
      </button>
      <TransitionWrapper
        isOpen={isComponentVisible}
        sx={
          "fixed sm:absolute right-0 top-[65px] w-screen sm:w-max h-screen sm:min-w-[370px] sm:h-[345px] z-[10000]"
        }
      >
        <UserMenuItems onItemClick={() => setIsComponentVisible(!isComponentVisible)} />
      </TransitionWrapper>
    </div>
  );
};

interface UserMenuItemsProps {
  onItemClick: () => void;
}
const UserMenuItems: FC<UserMenuItemsProps> = ({ onItemClick }) => {
  const router = useRouter();
  const { session, logout } = useSession();
  const currentBook = useSelector((state) => state.books.current);
  const userEnrollment = useSelector((state) => state.enrollments.current);
  const currentProfile = useSelector((state: RootState) => state.profile.current);
  return (
    <ul className="flex flex-col gap-[30px] sm:gap-0 sm:justify-between items-start bg-bkg-light border border-border-light h-full w-full px-[30px] py-[20px] rounded overflow-hidden relative [&>li]:w-full [&>li>i]:duration-150 [&>li]:hover:[&>i]:mr-[2px] [&>li]:hover:[&>i]:text-action-secondary">
      <li className="flex items-center gap-[10px]">
        <Image
          className="shrink-0 w-[50px] h-[50px] rounded-full object-cover border-2 border-dark-pure"
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
        <div className="flex items-center gap-[10px]">
          <Image src={icons.point} className="w-auto h-[25px]" />
          <Paragraph
            variant={paragraphVariants.regular}
            content={userEnrollment?.totalPoints}
            sx={"text-content-dark"}
          />
        </div>
        <div className="flex items-center gap-[10px]">
          <Image src={icons.streak} className="w-auto h-[25px]" />
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
      <div className="w-full border-b border-border-light" />
      <li
        className="items-center gap-[10px] cursor-pointer sm:hidden flex"
        onClick={() => {
          router.push(`${currentBook?.slug}/${pagePaths.history}`);
          onItemClick();
        }}
      >
        <i className="gng-journal text-content-secondary text-[20px]" />
        <Paragraph
          variant={paragraphVariants.regular}
          content={"Journaling History"}
          sx={"text-content-dark"}
        />
      </li>
      <li
        className="flex items-center gap-[10px] cursor-pointer"
        onClick={() => {
          router.push(`/${currentBook?.slug}/${pagePaths.settings}`);
          onItemClick();
        }}
      >
        <i className="gng-settings text-content-secondary text-[20px]" />
        <Paragraph
          variant={paragraphVariants.regular}
          content={"Settings"}
          sx={"text-content-dark"}
        />
      </li>
      <li
        className="flex items-center gap-[10px] cursor-pointer"
        onClick={() => {
          window.open(
            "mailto:bitechxconnect+kojwp6mtw4hinjw7vdoe@boards.trello.com",
            "_blank",
            "noopener,noreferrer"
          );
          onItemClick();
        }}
      >
        <i className="gng-alert text-content-secondary text-[20px]" />
        <Paragraph
          variant={paragraphVariants.regular}
          content={"Report A Bug"}
          sx={"text-content-dark"}
        />
      </li>
      <li
        className="items-center gap-[10px] cursor-pointer sm:hidden flex"
        onClick={() => {
          window.open(
            "https://glxu7q1mylasl0ssnlqn.app.clientclub.net",
            "_blank",
            "noopener,noreferrer"
          );
          onItemClick();
        }}
      >
        <i className="gng-people text-content-secondary text-[20px]" />
        <Paragraph
          variant={paragraphVariants.regular}
          content={"Join Gynergy Community"}
          sx={"text-content-dark"}
        />
      </li>
      <li
        className="flex items-center gap-[10px] cursor-pointer"
        onClick={() => {
          logout();
          onItemClick();
        }}
      >
        <i className="gng-sign-out text-content-secondary text-[20px]" />
        <Paragraph
          variant={paragraphVariants.regular}
          content={"Sign Out"}
          sx={"text-content-dark"}
        />
      </li>
    </ul>
  );
};

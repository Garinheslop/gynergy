"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { usePopup } from "@contexts/UsePopup";
import ActionButton from "@modules/common/components/ActionButton";
import { SectionErrorBoundary } from "@modules/common/components/ErrorBoundary";
import Input from "@modules/common/components/Input";
import Loader from "@modules/common/components/Loader";
import SectionCard from "@modules/common/components/SectionCard";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import SubscriptionManagement from "@modules/payment/components/SubscriptionManagement";
import { loaderTypes } from "@resources/types/loader";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { getLatestBookSession } from "@store/modules/book";
import { getUserBookSessionData, resetUserBookSessionData } from "@store/modules/enrollment";
import { updateUserProfileData } from "@store/modules/profile";

import ProfileImage from "../ProfileImage";

type InputState = {
  value?: string;
  error: string;
};

type File = {
  name: string;
  fileStr: string;
  contentType: string;
};

const BOOK_SLUG = "date-zero-gratitude";

const SettingsPageClient: React.FC = () => {
  const dispatch = useDispatch();
  const { messagePopupObj } = usePopup();
  const router = useRouter();
  const profile = useSelector((state) => state.profile);
  const books = useSelector((state) => state.books);
  const enrollments = useSelector((state) => state.enrollments);
  const [firstName, setFirstName] = useState<InputState>({ value: "", error: "" });
  const [lastName, setLastName] = useState<InputState>({ value: "", error: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    if (!profile?.current?.id) {
      router.push("/");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    if (profile?.current?.firstName) {
      setFirstName({ value: profile?.current?.firstName, error: "" });
    }
    if (profile?.current?.lastName) {
      setLastName({ value: profile?.current?.lastName, error: "" });
    }
  }, [profile?.current]);

  // Ensure book + enrollment data is loaded (normally loaded on dashboard page)
  useEffect(() => {
    if (profile?.current?.id && !books.current && !books.loading && !books.error) {
      dispatch(getLatestBookSession(BOOK_SLUG));
    }
  }, [profile?.current?.id, books.current, books.loading, books.error, dispatch]);

  useEffect(() => {
    if (books.current?.id && !enrollments.current && !enrollments.loading && !enrollments.error) {
      dispatch(getUserBookSessionData(books.current.id));
    }
  }, [books.current?.id, enrollments.current, enrollments.loading, enrollments.error, dispatch]);

  useEffect(() => {
    if (!profile?.updating && updating) {
      setUpdating(false);
      setImageFile(null);
      messagePopupObj.open({
        popupData: {
          heading: `Profile Updated`,
          description: `Profile updated successfully`,
        },
      });
    }
  }, [profile.updating]);

  // Track reset completion and show success feedback
  const wasResettingRef = useRef(false);
  useEffect(() => {
    if (enrollments.resetting) {
      wasResettingRef.current = true;
    } else if (wasResettingRef.current) {
      wasResettingRef.current = false;
      if (!enrollments.error) {
        messagePopupObj.open({
          popupData: {
            heading: "Progress Reset",
            description:
              "Your journaling history has been reset successfully. You will be redirected to start fresh.",
          },
        });
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    }
  }, [enrollments.resetting]);

  const handleSaveChanges = () => {
    setUpdating(true);

    if (!firstName.value) {
      setFirstName((prev) => ({ ...prev, error: "First Name Required." }));
    }
    if (!lastName.value) {
      setLastName((prev) => ({ ...prev, error: "Last Name Required." }));
    }
    if (firstName.value && lastName.value) {
      const data: any = {};
      if (
        firstName.value !== profile?.current?.firstName ||
        lastName.value !== profile?.current?.lastName
      ) {
        data.firstName = firstName.value;
        data.lastName = lastName.value;
      }
      if (imageFile) {
        data.fileStr = imageFile.fileStr;
        data.fileName = imageFile.name;
        data.contentType = imageFile.contentType;
      }
      if (data?.firstName || data?.lastName || data?.fileStr) {
        dispatch(updateUserProfileData(data));
      }
    }
  };

  const isChanged = useMemo(() => {
    return (
      firstName.value !== profile?.current?.firstName ||
      lastName.value !== profile?.current?.lastName ||
      imageFile !== null
    );
  }, [firstName.value, lastName.value, imageFile, profile?.current]);

  const sessionId = enrollments.current?.session?.id;
  const dataLoading = books.loading || enrollments.loading;

  const handleReset = () => {
    if (enrollments.resetting || dataLoading) return;
    if (!sessionId) {
      messagePopupObj.open({
        popupData: {
          heading: "No Active Session",
          description:
            "No active journaling session found. Please contact support if you believe this is an error.",
        },
      });
      return;
    }
    messagePopupObj.open({
      popupData: {
        description:
          "Are you sure you want to delete all your journals? This action is irreversible.",
        heading: "Reset Date Zero Progress",
        cta: {
          action: () => dispatch(resetUserBookSessionData(sessionId)),
          label: "Confirm",
          style: "bg-danger [&>p]:text-content-light",
        },
      },
    });
  };

  return (
    <section className="mx-auto flex max-w-[804px] flex-col px-4 py-[100px] md:py-[130px]">
      {enrollments.resetting && <Loader type={loaderTypes.window} />}
      <Heading variant={headingVariants.heading} sx="!font-bold text-center capitalize">
        My Settings
      </Heading>

      <SectionCard sx={"mt-8 mb-[55px]"}>
        <>
          <div className="flex flex-col gap-5">
            <Heading variant={headingVariants.title} sx="!font-bold">
              Account Details
            </Heading>
            <ProfileImage onFileChangeHandler={(file: any) => setImageFile(file)} />
            <div className="flex flex-col gap-5 sm:flex-row">
              <Input
                label="First Name"
                value={firstName?.value || ""}
                error={firstName.error}
                onChange={(e) => setFirstName({ value: e.target.value, error: "" })}
                inputPlaceholder="First Name"
              />
              <Input
                label="Last Name"
                value={lastName?.value || ""}
                error={lastName.error}
                onChange={(e) => setLastName({ value: e.target.value, error: "" })}
                inputPlaceholder="Last Name"
              />
            </div>
            <Input label="Email Address" value={profile?.current?.email || ""} disabled />
          </div>
          <div className="border-border-light border-b"></div>
          <ActionButton
            isSpinner
            label="Save Changes"
            onClick={handleSaveChanges}
            isLoading={updating || profile.updating}
            disabled={!isChanged || updating || profile.updating}
          />
        </>
      </SectionCard>

      <SectionCard sx={"mb-[55px]"}>
        <SectionErrorBoundary sectionName="Subscription Management">
          <SubscriptionManagement />
        </SectionErrorBoundary>
      </SectionCard>

      <SectionCard sx={"gap-8"}>
        <>
          <Heading variant={headingVariants.heading} sx="!font-bold text-center capitalize">
            Reset Your Journaling History
          </Heading>
          <div className="relative mx-auto flex w-fit flex-col gap-3">
            <Paragraph
              variant={paragraphVariants.regular}
              content={
                "If you want to restart your Date Zero journey, you can reset your journaling history. Please note that:"
              }
            />
            <Paragraph
              variant={paragraphVariants.regular}
              content={
                "1. All your journaling history will be deleted and it will start again from day 1"
              }
            />
            <Paragraph
              variant={paragraphVariants.regular}
              content={"2. Your points and streak will be reset"}
            />
            <Paragraph
              variant={paragraphVariants.regular}
              isHtml
              sx={"[&>span]:text-danger"}
              content={"3. <span>This action cannot be undone</span>"}
            />
            <Paragraph
              variant={paragraphVariants.regular}
              content={
                "Before proceeding, please discuss it with your Date Zero program coordinator at Gynergy."
              }
              sx={"mt-8"}
            />
          </div>
          <ActionButton
            isSpinner
            label={dataLoading ? "Loading session data..." : "Reset Your Account"}
            onClick={handleReset}
            isLoading={dataLoading}
            sx={sessionId ? "bg-danger [&>p]:text-content-light" : ""}
            disabled={updating || enrollments.resetting || dataLoading}
          />
        </>
      </SectionCard>
    </section>
  );
};

export default SettingsPageClient;

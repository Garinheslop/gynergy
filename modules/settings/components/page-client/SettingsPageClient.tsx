"use client";

import React, { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { usePopup } from "@contexts/UsePopup";
import ActionButton from "@modules/common/components/ActionButton";
import Input from "@modules/common/components/Input";
import Loader from "@modules/common/components/Loader";
import SectionCard from "@modules/common/components/SectionCard";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { loaderTypes } from "@resources/types/loader";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { resetUserBookSessionData } from "@store/modules/enrollment";
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

const SettingsPageClient: React.FC = () => {
  const dispatch = useDispatch();
  const { messagePopupObj } = usePopup();
  const router = useRouter();
  const profile = useSelector((state) => state.profile);
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

  const handleReset = () => {
    const sessionId = enrollments.current?.session?.id;
    if (!enrollments.resetting && sessionId) {
      messagePopupObj.open({
        popupData: {
          description:
            "Are you sure you want to delete all you journals? This action is irreversible.",
          heading: "Reset Date Zero Progress",
          cta: {
            action: () => dispatch(resetUserBookSessionData(sessionId)),
            label: "Confirm",
            style: "bg-danger [&>p]:text-content-light",
          },
        },
      });
    }
  };

  return (
    <section className="mx-auto flex max-w-[804px] flex-col px-4 py-[100px] md:py-[130px]">
      {enrollments.resetting && <Loader type={loaderTypes.window} />}
      <Heading variant={headingVariants.heading} sx="!font-bold text-center capitalize">
        My Settings
      </Heading>

      <SectionCard sx={"mt-[30px] mb-[55px]"}>
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
            label="Reset Your Account"
            onClick={handleReset}
            sx={"bg-primary"}
            disabled={updating}
          />
        </>
      </SectionCard>
    </section>
  );
};

export default SettingsPageClient;

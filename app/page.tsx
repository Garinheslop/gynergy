"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@contexts/UseSession";
import { createClient } from "@lib/supabase-client";
import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import Input from "@modules/common/components/Input";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import icons from "@resources/icons";
import images from "@resources/images";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { updateUserProfileData } from "@store/modules/profile";

const formTypes = {
  signIn: "sign-in",
  nameInput: "name-input",
};

export default function LandingPage() {
  const { session, authenticating } = useSession();
  const router = useRouter();
  const supabase = createClient();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.profile);
  const authError = useSearchParams().get("error_description");

  const [formType, setFormType] = useState<(typeof headingVariants)[keyof typeof headingVariants]>(
    formTypes.signIn
  );
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  useEffect(() => {
    if (session && profile.current) {
      if (!profile.current?.firstName && !profile.current?.lastName) {
        setFormType(formTypes.nameInput);
        setMessage("");
        setError("");
      } else {
        router.push("/date-zero-gratitude");
      }
    }
  }, [session, profile.current]);

  useEffect(() => {
    if (session && profile.current) {
      if (!profile.current?.firstName && !profile.current?.lastName) {
        setFormType(formTypes.nameInput);
        setMessage("");
        setError("");
      } else {
        router.push("/date-zero-gratitude");
      }
    }
  }, [session, profile.current]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    if (formType === formTypes.nameInput) {
      dispatch(updateUserProfileData({ firstName, lastName }));
    } else if (formType === formTypes.signIn) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          // options: {
          //   emailRedirectTo: "http://localhost:3000",
          // },
        });
        if (error) throw error;

        setMessage("Check your email for the magic link. You can stay on this page.");
      } catch (err: any) {
        console.error("Sign in error:", err);
        setError(err?.message ?? "Error sending login link. Please try again after few minutes.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <section className="bg-bkg-light flex h-screen grid-cols-2 flex-col items-center justify-center gap-[50px] overflow-hidden md:grid md:gap-0">
      <Image
        className={cn("h-[300px] w-full object-contain md:h-full md:object-cover", {
          "hidden md:order-1 md:flex": formType === formTypes.nameInput,
        })}
        src={images.banner.login}
        unoptimized
        height={1}
        width={1}
        alt="date-zero-logo"
      />
      <div
        className={cn(
          "mx-auto flex w-full flex-col items-start justify-center gap-[40px] px-5 lg:gap-[50px] xl:w-[640px]"
        )}
      >
        <div className="flex w-full flex-col items-center justify-center gap-5 md:items-start md:justify-start md:gap-[10px]">
          <Image
            className="h-[40px] w-auto"
            src={icons.dateZeroLogo}
            unoptimized
            height={1}
            width={1}
            alt="date-zero-logo"
          />
          <Heading
            variant={headingVariants.heading}
            sx="!font-bold md:text-start text-center capitalize"
          >
            {formType === formTypes.nameInput
              ? "What should we call you?"
              : "Welcome to Your Journey"}
          </Heading>
          <Paragraph
            content={
              formType === formTypes.nameInput
                ? "Enter your first and last name to get started."
                : "Begin your path to mindful growth"
            }
            variant={paragraphVariants.title}
            sx="text-content-dark-secondary md:text-start text-center"
          />
        </div>
        {message ? (
          <Paragraph
            content={message}
            variant={paragraphVariants.regular}
            sx="text-action-700 text-center sm:text-start"
          />
        ) : (
          <div className="flex w-full flex-col gap-5 md:gap-[30px] lg:gap-[50px]">
            {formType === formTypes.nameInput ? (
              <div className="flex w-full flex-col gap-[15px] md:flex-row">
                <Input
                  label="First Name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  disabled={authenticating || isLoading || profile.updating}
                />
                <Input
                  label="Last Name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  disabled={authenticating || isLoading || profile.updating}
                />
              </div>
            ) : (
              <Input
                label="Email Address"
                value={email}
                error={error}
                disabled={authenticating || isLoading || profile.loading}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) {
                    setError("");
                  }
                }}
              />
            )}
            <ActionButton
              isSpinner
              label={formType === formTypes.signIn ? "Sign In" : "Save"}
              icon={formType === formTypes.signIn ? "" : "arrow-right-long"}
              onClick={handleSubmit}
              isLoading={authenticating || isLoading || profile.updating}
              disabled={authenticating || isLoading || profile.updating}
              sx="flex-row-reverse"
            />
          </div>
        )}
      </div>
    </section>
  );
}

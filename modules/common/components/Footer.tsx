"use client";
import Link from "next/link";
import { cn } from "@lib/utils/style";

const Footer = ({ sx }: { sx?: string }) => {
  return (
    <footer className="flex flex-col w-full items-center justify-center sm:pt-[100px] sm:pb-[50px] pt-[50px] pb-5 ">
      <div className="flex flex-col sm:flex-row gap-[5px] justify-center items-center">
        <div className={cn("flex gap-[5px] text-center text-[16px] text-content-dark", sx)}>
          Copyright © 2025 . Gynergy . All rights reserved.
        </div>
        <div className={cn("flex gap-[5px] text-center text-[16px] text-content-dark", sx)}>
          <Link
            className="duration-200 hover:opacity-70 !underline"
            href={
              "https://app.termly.io/policy-viewer/policy.html?policyUUID=547ca51c-f060-400b-baa0-d12d4adb9edf"
            }
            target="_blank"
          >
            Terms
          </Link>
          .
          <Link
            className="duration-200 hover:opacity-70 !underline"
            href={
              "https://app.termly.io/policy-viewer/policy.html?policyUUID=b816b72f-eba6-4079-9f6e-201d10b19e50"
            }
            target="_blank"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
      <p className={cn("hidden sm:flex gap-[5px] text-center text-[16px] text-content-dark", sx)}>
        Software designed and developed by
        <Link
          className="duration-200 hover:opacity-70 !text-[#5C92FF]"
          href={"https://www.bitechx.com/"}
          target="_blank"
        >
          BiTechX LLC
        </Link>
      </p>
      <p className={cn("sm:hidden flex gap-[5px] text-center text-[16px] text-content-dark", sx)}>
        Designed and Developed by
        <Link
          className="duration-200 hover:opacity-70 !text-[#5C92FF]"
          href={"https://www.bitechx.com/"}
          target="_blank"
        >
          BiTechX LLC
        </Link>
      </p>
    </footer>
  );
};

export default Footer;

"use client";
import Link from "next/link";

import { cn } from "@lib/utils/style";

const Footer = ({ sx }: { sx?: string }) => {
  return (
    <footer className="flex w-full flex-col items-center justify-center pt-12 pb-5 sm:pt-24 sm:pb-12">
      <div className="flex flex-col items-center justify-center gap-1 sm:flex-row">
        <div className={cn("text-content-dark flex gap-1 text-center text-base", sx)}>
          Copyright © 2026 . Gynergy . All rights reserved.
        </div>
        <div className={cn("text-content-dark flex gap-1 text-center text-base", sx)}>
          <Link className="!underline duration-200 hover:opacity-70" href="/terms">
            Terms
          </Link>
          .
          <Link className="!underline duration-200 hover:opacity-70" href="/privacy">
            Privacy Policy
          </Link>
        </div>
      </div>
      <p className={cn("text-content-dark hidden gap-1 text-center text-base sm:flex", sx)}>
        Software designed and developed by
        <Link
          className="!text-link duration-200 hover:opacity-70"
          href={"https://www.bitechx.com/"}
          target="_blank"
        >
          BiTechX LLC
        </Link>
      </p>
      <p className={cn("text-content-dark flex gap-1 text-center text-base sm:hidden", sx)}>
        Designed and Developed by
        <Link
          className="!text-link duration-200 hover:opacity-70"
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

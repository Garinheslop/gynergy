import React from "react";

import { cn } from "@lib/utils/style";

type Props = {
  sx?: string;
  children: React.ReactNode;
};

function SectionCard({ children, sx }: Props) {
  return (
    <section
      className={cn("rounded-large bg-bkg-light flex flex-col gap-10 p-5 shadow-2xs sm:p-10", sx)}
    >
      {children}
    </section>
  );
}

export default SectionCard;

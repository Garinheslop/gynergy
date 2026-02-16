import React, { ReactNode } from "react";

import { cn } from "@lib/utils/style";
import { loaderTypes } from "@resources/types/loader";
import { paragraphVariants } from "@resources/variants";

import Modal from "./modal";
import Paragraph from "./typography/Paragraph";

const Loader = ({
  label,
  heading,
  type,
  children: _children,
  sx,
}: {
  heading?: string;
  label?: string;
  sx?: string;
  type: string;
  children?: ReactNode;
}) => {
  if (type === loaderTypes.spinner) {
    return (
      <div className="text-body text-content-reverse inline-flex flex-col items-center gap-2 rounded-lg text-center font-medium">
        <svg
          aria-hidden="true"
          role="status"
          className={cn("text-action inline h-8 w-8 animate-spin", sx)}
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="#E5E7EB"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentColor"
          />
        </svg>
        {label && <p className="text-loading text-content/80 ml-2">{label}</p>}
      </div>
    );
  } else if (type === loaderTypes.window) {
    return (
      <section
        className={cn(
          "bg-bkg-light/90 z-modal fixed top-0 left-0 flex h-screen w-screen items-center justify-center overflow-hidden p-4 backdrop-blur-sm",
          sx
        )}
      >
        <div className="gradient-animation flex flex-col items-center justify-center overflow-hidden">
          <i id="clipWave" className={cn("gng-infinity text-[100px] text-transparent", sx)} />
          {label && <p className="text-content/80">{label}</p>}
        </div>
      </section>
    );
  } else if (type === loaderTypes.card) {
    return (
      <Modal open={true} onClose={() => {}}>
        <section
          className={cn(
            "bg-bkg-light flex h-screen w-screen flex-col items-center justify-center rounded p-8 sm:h-[300px] sm:w-[470px]",
            sx
          )}
        >
          <div className="gradient-animation flex flex-col items-center justify-center overflow-hidden">
            <i id="clipWave" className={cn("gng-infinity text-[100px] text-transparent", sx)} />
          </div>
          <div className="flex flex-col gap-2.5">
            {heading && (
              <Paragraph
                content={heading}
                variant={paragraphVariants.titleLg}
                sx="font-bold text-center"
              />
            )}
            {label && (
              <Paragraph
                content={label}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary text-center"
              />
            )}
          </div>
        </section>
      </Modal>
    );
  } else return <></>;
};

export default Loader;

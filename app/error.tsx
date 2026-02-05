"use client";
import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useDispatch } from "react-redux";

import { usePopup } from "@contexts/UsePopup";
import { pagePaths } from "@resources/paths";
import { signOutAndReset } from "@store/modules/profile";

export default function Error({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { messagePopupObj } = usePopup();
  useEffect(() => {
    messagePopupObj.open({
      popupData: {
        heading: "Something Went Wrong",
        description: "Oops! Something went wrong with your request. Please reload the site again.",
        cta: {
          label: "Reload",
          action: () => {
            dispatch(signOutAndReset());
            router.push(`${pagePaths.home}`);
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          },
        },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);
}

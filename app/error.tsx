"use client";
import { usePopup } from "@contexts/UsePopup";
import { pagePaths } from "@resources/paths";
import { signOutAndReset } from "@store/modules/profile";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { messagePopupObj } = usePopup();
  useEffect(() => {
    console.log({ error });
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
  }, [error]);

  const reloadHandler = () => {
    dispatch(signOutAndReset());
    router.push(`${pagePaths.home}`);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };
}

import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { ClassValue } from "clsx";

export const cn = (...args: ClassValue[]) => {
  return twMerge(clsx(args));
};

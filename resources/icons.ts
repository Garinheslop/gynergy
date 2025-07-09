interface WebpackRequireContext {
  (key: string): any;
  keys(): string[];
  resolve(key: string): string;
}

declare const require: {
  (path: string): any;
  context(directory: string, useSubdirectories: boolean, regExp?: RegExp): WebpackRequireContext;
};

const iconsList = require.context("@public/icons", true);

const getIcon = (name: string, list: WebpackRequireContext): string => {
  return list(`./${name}`).default.src;
};

const icons = {
  community: getIcon("community.svg", iconsList),
  dateZeroLogo: getIcon("date-zero-logo.svg", iconsList),
  streak: getIcon("streak.svg", iconsList),
  point: getIcon("point.svg", iconsList),
};

export const fontIcons = {
  emoji: {
    smileFull: "emoji-smile-full",
    smile: "emoji-smile",
    face: "emoji-face",
    sad: "emoji-sad",
    sadFull: "emoji-sad-full",
  },
};

export default icons;

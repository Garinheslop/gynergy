interface WebpackRequireContext {
  (key: string): any;
  keys(): string[];
  resolve(key: string): string;
}

declare const require: {
  (path: string): any;
  context(directory: string, useSubdirectories: boolean, regExp?: RegExp): WebpackRequireContext;
};

const imagesList = require.context("@public/images", true);

const getImage = (name: string, list: WebpackRequireContext): string => {
  return list(`./${name}`).default.src;
};

const images = {
  badges: {
    prizeWinner: getImage("prize-medal-winner-award-star.svg", imagesList),
  },
  placeholders: {
    profileImage: getImage("profile-image-placeholder.jpg", imagesList),
    video: getImage("video-placeholder.png", imagesList),
    image: getImage("image-placeholder.jpg", imagesList),
  },
  banner: {
    login: getImage("login-banner.jpg", imagesList),
  },
  inspirationGratitude: getImage("inspiration-gratitude.jpg", imagesList),
  congratsAvatar: getImage("congrats-avatar.png", imagesList),
};

export default images;

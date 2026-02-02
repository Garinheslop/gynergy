module.exports = {
  // TypeScript and JavaScript files
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],

  // JSON, Markdown, and other files
  "*.{json,md,yml,yaml}": ["prettier --write"],

  // CSS files
  "*.css": ["prettier --write"],
};

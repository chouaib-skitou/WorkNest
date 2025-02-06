export default [
  {
    ignores: ["node_modules/", "dist/", ".env"],
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      "semi": ["error", "always"],
      "quotes": ["error", "double"],
      "no-unused-vars": ["warn"],
      "no-console": "off"
    }
  }
];

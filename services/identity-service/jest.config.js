// jest.config.js
export default {
    transform: {
      "^.+\\.[tj]sx?$": "babel-jest"
    },
    // Ignore the dist directory
    testPathIgnorePatterns: ["/dist/"],
    // Define where to look for tests (if needed)
    roots: ["<rootDir>/tests", "<rootDir>/"],
    moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  };
  
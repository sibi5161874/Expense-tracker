/**
 * Jest + jest-expo, not Vitest — React Native's Flow-typed source and native-module
 * mocking need Expo's own Babel/Metro-compatible transform, which `jest-expo` provides
 * and Vitest has no production-ready equivalent for. `packages/shared` (pure logic, no RN)
 * stays on Vitest; see RULES.md's testing section.
 */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // The default preset ignores everything in node_modules, but RN/Expo packages ship
  // untranspiled ESM that has to go through Babel to be requireable from a test.
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|react-native-css-interop))',
  ],
};

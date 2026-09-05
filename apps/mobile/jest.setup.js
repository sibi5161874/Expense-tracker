// @testing-library/react-native (v12+) auto-extends Jest with its own RN-aware matchers
// (toBeOnTheScreen, toHaveTextContent, ...) on import elsewhere — no separate setup needed.
// Deliberately not using @testing-library/jest-dom here, which only understands DOM nodes
// and is meaningless in React Native.

// AsyncStorage's real native module doesn't exist under Jest ("NativeModule: AsyncStorage
// is null") — this is AsyncStorage's own documented Jest mock, needed by anything that
// imports theme/ThemeProvider.tsx (transitively, via lib/themePreference.ts).
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

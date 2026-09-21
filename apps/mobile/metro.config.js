const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo (shared packages & root node_modules)
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// forceWriteFileSystem skips nativewind's virtual-module fast-refresh-CSS path, which reads
// Metro's private dependency-graph internal (graph._fileSystem) to patch it — that internal's
// shape changed in the Metro version Expo SDK 57 ships, so it comes back undefined and crashes
// the whole dev server with "Cannot read properties of undefined (reading 'getSha1')" the
// moment a style file changes. This trades away that CSS-only fast-refresh optimization for a
// plain "write the CSS output to disk, let Metro's normal file watcher pick it up" path, which
// doesn't touch that internal at all.
module.exports = withNativeWind(config, { input: "./global.css", forceWriteFileSystem: true });


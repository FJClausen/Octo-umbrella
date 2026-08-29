#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Read bundled native modules from Expo SDK
const expoModulesPath = path.join(projectRoot, 'node_modules', 'expo', 'bundledNativeModules.json');
let bundledModules = {};

if (fs.existsSync(expoModulesPath)) {
  bundledModules = JSON.parse(fs.readFileSync(expoModulesPath, 'utf8'));
}

// Read package.json
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Check critical native module versions
const criticalModules = {
  'react-native-reanimated': true,
  'react-native-worklets-core': true,
};

let hasErrors = false;

for (const [moduleName, _] of Object.entries(criticalModules)) {
  const installedVersion = packageJson.dependencies?.[moduleName] || packageJson.devDependencies?.[moduleName];
  const bundledVersion = bundledModules[moduleName];

  if (!installedVersion) {
    console.error(`❌ ${moduleName} not found in package.json dependencies`);
    hasErrors = true;
    continue;
  }

  // Check if versions match (exact match required for reanimated/worklets)
  if (installedVersion !== bundledVersion) {
    console.error(
      `❌ ${moduleName} version mismatch:\n` +
      `   Installed: ${installedVersion}\n` +
      `   Bundled in Expo SDK: ${bundledVersion}\n` +
      `   These must match exactly for C++ bindings to work correctly.`
    );
    hasErrors = true;
  } else {
    console.log(`✓ ${moduleName} ${installedVersion} matches Expo SDK`);
  }
}

if (hasErrors) {
  console.error('\n⚠️  Native version mismatch detected. This will cause iOS build failures.');
  console.error('Run: npm ci (not npm install) to resolve lockfile and install exact versions');
  process.exit(1);
}

console.log('\n✓ All native module versions are correct');
process.exit(0);

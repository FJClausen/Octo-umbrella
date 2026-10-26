// Bundled JSON lives in ../content, outside the app folder, so Metro must watch it.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, '../content')];

module.exports = config;

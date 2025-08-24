const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for video files
config.resolver.assetExts.push('mp4', 'mov', 'avi', 'mkv', 'wmv');

// Enable SVG support
config.resolver.sourceExts.push('svg');

// Optimize bundle size for video processing
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
#!/usr/bin/env node

/**
 * ReplantaSystem Multi-Platform Build Script
 * Builds for Web (PWA), Android, and iOS
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Build configuration
const config = {
  web: {
    name: "Web (PWA)",
    outDir: "dist/web",
    buildCommand: "npm run build:web",
  },
  android: {
    name: "Android",
    outDir: "android",
    buildCommand: "npm run build:android",
  },
  ios: {
    name: "iOS",
    outDir: "ios",
    buildCommand: "npm run build:ios",
  },
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      stdio: "inherit",
      encoding: "utf8",
      ...options,
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function cleanBuildDirectories() {
  log("\n🧹 Cleaning build directories...", "yellow");

  const dirsToClean = ["dist", "android/app/build", "ios/App/build"];

  for (const dir of dirsToClean) {
    if (fs.existsSync(dir)) {
      log(`  Cleaning ${dir}`, "cyan");
      execCommand(`rm -rf ${dir}`);
    }
  }

  log("✅ Cleaned build directories", "green");
}

async function buildWeb() {
  log("\n🌐 Building Web (PWA)...", "blue");

  // Build client
  const buildResult = execCommand("npm run build:client");
  if (!buildResult.success) {
    log("❌ Web build failed", "red");
    return false;
  }

  // Verify PWA files exist
  const pwaFiles = [
    "dist/spa/manifest.json",
    "dist/spa/sw-pwa.js",
    "dist/spa/index.html",
  ];

  for (const file of pwaFiles) {
    if (!fs.existsSync(file)) {
      log(`❌ Missing PWA file: ${file}`, "red");
      return false;
    }
  }

  log("✅ Web (PWA) build completed", "green");
  return true;
}

async function buildAndroid() {
  log("\n🤖 Building Android...", "blue");

  // Ensure web build exists
  if (!fs.existsSync("dist/spa")) {
    log("Building web first...", "yellow");
    const webBuild = await buildWeb();
    if (!webBuild) return false;
  }

  // Add Android platform if not exists
  if (!fs.existsSync("android")) {
    log("Adding Android platform...", "cyan");
    const addResult = execCommand("npx cap add android");
    if (!addResult.success) {
      log("❌ Failed to add Android platform", "red");
      return false;
    }
  }

  // Sync web assets to Android
  log("Syncing web assets to Android...", "cyan");
  const syncResult = execCommand("npx cap sync android");
  if (!syncResult.success) {
    log("❌ Failed to sync Android", "red");
    return false;
  }

  log("✅ Android project prepared", "green");
  log("📱 To build APK/AAB, open Android Studio:", "yellow");
  log("   npx cap open android", "cyan");

  return true;
}

async function buildIOS() {
  log("\n🍎 Building iOS...", "blue");

  // Check if running on macOS
  if (process.platform !== "darwin") {
    log("❌ iOS builds require macOS", "red");
    return false;
  }

  // Ensure web build exists
  if (!fs.existsSync("dist/spa")) {
    log("Building web first...", "yellow");
    const webBuild = await buildWeb();
    if (!webBuild) return false;
  }

  // Add iOS platform if not exists
  if (!fs.existsSync("ios")) {
    log("Adding iOS platform...", "cyan");
    const addResult = execCommand("npx cap add ios");
    if (!addResult.success) {
      log("❌ Failed to add iOS platform", "red");
      return false;
    }
  }

  // Sync web assets to iOS
  log("Syncing web assets to iOS...", "cyan");
  const syncResult = execCommand("npx cap sync ios");
  if (!syncResult.success) {
    log("❌ Failed to sync iOS", "red");
    return false;
  }

  log("✅ iOS project prepared", "green");
  log("📱 To build IPA, open Xcode:", "yellow");
  log("   npx cap open ios", "cyan");

  return true;
}

async function generateIcons() {
  log("\n🎨 Checking icons and splash screens...", "blue");

  const iconSizes = [
    "16x16",
    "32x32",
    "72x72",
    "96x96",
    "128x128",
    "144x144",
    "152x152",
    "180x180",
    "192x192",
    "384x384",
    "512x512",
  ];

  const iconsDir = "public/icons";
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  let missingIcons = [];
  for (const size of iconSizes) {
    const iconPath = path.join(iconsDir, `icon-${size}.png`);
    if (!fs.existsSync(iconPath)) {
      missingIcons.push(size);
    }
  }

  if (missingIcons.length > 0) {
    log("⚠️  Missing icons for sizes:", "yellow");
    missingIcons.forEach((size) => log(`   - ${size}`, "yellow"));
    log("💡 Use a tool like https://realfavicongenerator.net/", "cyan");
  } else {
    log("✅ All icons present", "green");
  }
}

async function validateEnvironment() {
  log("\n🔍 Validating environment...", "blue");

  const requiredCommands = ["node", "npm", "npx"];
  const optionalCommands = ["cap"];

  for (const cmd of requiredCommands) {
    try {
      execCommand(`which ${cmd}`, { stdio: "ignore" });
      log(`✅ ${cmd} found`, "green");
    } catch {
      log(`❌ ${cmd} not found`, "red");
      return false;
    }
  }

  // Check if Capacitor CLI is installed
  try {
    execCommand("npx cap --version", { stdio: "ignore" });
    log("✅ Capacitor CLI available", "green");
  } catch {
    log("⚠️  Capacitor CLI not found, installing...", "yellow");
    execCommand("npm install -g @capacitor/cli");
  }

  return true;
}

async function buildPlatform(platform) {
  const startTime = Date.now();

  switch (platform) {
    case "web":
      return await buildWeb();
    case "android":
      return await buildAndroid();
    case "ios":
      return await buildIOS();
    default:
      log(`❌ Unknown platform: ${platform}`, "red");
      return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const requestedPlatforms = args.length > 0 ? args : ["web"];

  log("🚀 ReplantaSystem Multi-Platform Builder", "bright");
  log("==========================================", "bright");

  // Validate environment
  const envValid = await validateEnvironment();
  if (!envValid) {
    log("❌ Environment validation failed", "red");
    process.exit(1);
  }

  // Generate icons check
  await generateIcons();

  // Clean build directories
  await cleanBuildDirectories();

  const results = {};
  const startTime = Date.now();

  // Build requested platforms
  for (const platform of requestedPlatforms) {
    if (!config[platform]) {
      log(`❌ Unknown platform: ${platform}`, "red");
      results[platform] = false;
      continue;
    }

    log(`\n📦 Building ${config[platform].name}...`, "bright");
    try {
      const success = await buildPlatform(platform);
      results[platform] = success;
    } catch (err) {
      log(`❌ Build error for ${platform}: ${err.message || err}`, "red");
      results[platform] = false;
    }
  }

  // Summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log("\n📊 Build Summary", "bright");
  log("================", "bright");

  for (const [platform, success] of Object.entries(results)) {
    const status = success ? "✅ SUCCESS" : "❌ FAILED";
    const color = success ? "green" : "red";
    log(`${config[platform]?.name || platform}: ${status}`, color);
  }

  log(`\n⏱️  Total time: ${duration}s`, "cyan");

  // Next steps
  log("\n🎯 Next Steps:", "bright");
  if (results.web) {
    log("• Web: Deploy dist/spa to hosting provider", "cyan");
    log("• PWA: Test offline functionality", "cyan");
  }
  if (results.android) {
    log("• Android: npx cap open android (build APK/AAB)", "cyan");
    log("• Android: Test on device with npx cap run android", "cyan");
  }
  if (results.ios) {
    log("• iOS: npx cap open ios (build IPA)", "cyan");
    log("• iOS: Test on device with npx cap run ios", "cyan");
  }

  log("\n🏪 App Store Deployment:", "bright");
  log("• Android: Upload to Google Play Console", "cyan");
  log("• iOS: Upload to App Store Connect", "cyan");
  log("• Web: Configure PWA for app store listing", "cyan");

  const allSuccess = Object.values(results).every(Boolean);
  process.exit(allSuccess ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    log(`❌ Build failed: ${error.message}`, "red");
    process.exit(1);
  });
}

module.exports = { buildPlatform, config };

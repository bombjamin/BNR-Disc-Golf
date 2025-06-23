# Complete Mac Setup for iOS Development

## Step 1: Install Node.js

Since you already have Homebrew installed, use it to install Node.js:

```bash
brew install node
```

## Step 2: Verify Installation

```bash
node --version
npm --version
```

You should see version numbers for both.

## Step 3: Install Project Dependencies

```bash
cd "/Users/benjaminrichter/Desktop/BNR Frisbee Golf APP/BNR-Disc-Golf"
npm install
```

## Step 4: Navigate to iOS Project

```bash
cd ios/App
```

## Step 5: Install iOS Dependencies

```bash
pod install
```

## Step 6: Open in Xcode

```bash
open App.xcworkspace
```

## Step 7: Run Your App

1. Select iPhone simulator in Xcode
2. Click Run (▶️)
3. Your golf app launches with full functionality

## Summary

You need both Node.js (for npm) and CocoaPods (already installed) to run the iOS project. The npm install creates the node_modules folder that contains the Capacitor iOS scripts needed by the Podfile.
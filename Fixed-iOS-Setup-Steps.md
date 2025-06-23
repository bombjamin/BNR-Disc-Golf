# Fixed iOS Setup Steps

## Step 3: Install Node Dependencies First

Navigate to your project root and install dependencies:

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
3. Your golf app launches

The npm install step creates the node_modules folder that the Podfile needs to reference the Capacitor iOS scripts.
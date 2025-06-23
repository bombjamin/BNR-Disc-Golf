# Exact iOS Setup Steps

## Step 3: Navigate to iOS Project

Open Terminal on your Mac and run:

```bash
cd "/Users/benjaminrichter/Desktop/BNR Frisbee Golf APP/BNR-Disc-Golf/ios/App"
```

## Step 4: Install iOS Dependencies

```bash
pod install
```

You should see output like:
- "Analyzing dependencies..."
- "Installing Capacitor..."
- "Generating Pods project"

## Step 5: Open in Xcode

**Important**: Open the workspace file (NOT the .xcodeproj):

```bash
open App.xcworkspace
```

## Step 6: Run Your App

1. In Xcode, select iPhone simulator from device dropdown
2. Click Run button (▶️) or press Cmd+R
3. Your golf app launches with backend connectivity

## If You Get "No such file or directory"

Make sure you've pulled the latest changes from GitHub first:

```bash
cd "/Users/benjaminrichter/Desktop/BNR Frisbee Golf APP/BNR-Disc-Golf"
git pull
```

Then navigate to the iOS folder and run pod install.
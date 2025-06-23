# Complete iOS Setup - Step by Step

## Step 1: Install CocoaPods on Your Mac

Open Terminal on your Mac and run these commands:

```bash
# Install CocoaPods
sudo gem install cocoapods

# Setup CocoaPods (first time only)
pod setup
```

## Step 2: Download the iOS Project

1. Download `ios-with-cocoapods-setup.tar.gz` from your Replit project
2. Extract the file (double-click or use `tar -xzf ios-with-cocoapods-setup.tar.gz`)
3. You should now have an `App` folder

## Step 3: Install iOS Dependencies

Navigate to the App folder and install dependencies:

```bash
cd /path/to/your/extracted/App
pod install
```

This will create `App.xcworkspace` and install all native dependencies.

## Step 4: Open in Xcode

**Important**: Open the workspace file, NOT the project file:

```bash
open App.xcworkspace
```

Or double-click `App.xcworkspace` in Finder.

## Step 5: Run the App

1. In Xcode, select a simulator (iPhone 15, iPhone 14, etc.) from the device dropdown
2. Click the Run button (▶️) or press Cmd+R
3. Your golf app will launch in the iOS Simulator

## Step 6: Test Functionality

Your app should now work with:
- User login and registration
- Game creation and joining
- Live score tracking
- Photo uploads
- Real backend connectivity

## If You Get Errors:

1. **"Command not found: pod"** - CocoaPods not installed, repeat Step 1
2. **Build errors** - Clean build folder (Product → Clean Build Folder)
3. **Simulator issues** - Try different iPhone simulator model

## Next Steps After Success:

- Test on a real iPhone device
- Continue with Phase 2: Enhanced native features
- Prepare for App Store submission

Your iOS app will be fully functional with live backend connectivity!
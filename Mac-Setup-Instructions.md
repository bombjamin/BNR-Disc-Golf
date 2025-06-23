# Mac Setup for iOS Development

## Install CocoaPods on Your Mac

Your iOS project requires CocoaPods to manage native dependencies. Run these commands on your Mac:

```bash
# Install CocoaPods
sudo gem install cocoapods

# Setup CocoaPods (first time only)
pod setup
```

## Complete iOS Setup Process

After installing CocoaPods, follow these steps:

1. **Download the iOS project** from your GitHub repository
2. **Navigate to the iOS project folder**:
   ```bash
   cd /path/to/your/project/ios/App
   ```
3. **Install iOS dependencies**:
   ```bash
   pod install
   ```
4. **Open the workspace file** (important - use .xcworkspace, not .xcodeproj):
   ```bash
   open App.xcworkspace
   ```
5. **Run in Xcode**: Select simulator and click Run

## Why This Is Needed

- Capacitor iOS projects use CocoaPods for native plugin management
- Camera, Device, and Filesystem plugins require native iOS dependencies
- CocoaPods handles version compatibility and linking

## Alternative: Simplified iOS Project

If you prefer to avoid CocoaPods setup, I can create a simplified iOS project with minimal native features for basic testing.
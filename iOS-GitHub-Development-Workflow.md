# iOS Development Workflow with GitHub

## Setup Complete! Here's your stable testing environment:

### Development Workflow:
1. **Make changes in Replit** (web app development)
2. **Build the project**: `npm run build`
3. **Sync to iOS**: `npx cap sync ios`
4. **Commit and push**: `git add . && git commit -m "Update" && git push`
5. **Pull on Mac**: `git pull` in your local repository
6. **Test in Xcode**: Open `App.xcworkspace` and run

### Key Points:
- **Repository URL**: Your GitHub repository URL (from Xcode clone)
- **iOS Project Path**: `ios/App/App.xcworkspace`
- **Bundle ID**: com.barnoneranch.golfscore
- **App Name**: Bar None Ranch Golf

### Testing on iOS:
1. Open `App.xcworkspace` in Xcode
2. Select iPhone simulator or connected device
3. Click Run ▶️ button
4. App launches with full native iOS features

### Sync Process:
- Changes to web app → `npm run build` → `npx cap sync ios` → Git push/pull → Test in Xcode
- This keeps your iOS project updated with latest web app changes

### Native Features Ready:
- Camera integration for golf course photos
- Photo gallery access
- Touch-optimized interface
- iOS-specific navigation and gestures
- Offline capability with service worker

Your iOS app is fully configured and ready for testing!
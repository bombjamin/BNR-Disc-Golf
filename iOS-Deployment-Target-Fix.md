# iOS Deployment Target Fixed

## What I Updated
- Changed iOS deployment target from 13.0 to 15.0 in Podfile
- Synced latest changes to iOS project

## Next Step
Run pod install again in your Terminal:

```bash
cd "/Users/benjaminrichter/Desktop/BNR Frisbee Golf APP/BNR-Disc-Golf/ios/App"
pod install
```

This should now work without the compatibility error.

## After Success
```bash
open App.xcworkspace
```

Then run your app in Xcode simulator.
# DoNotNervous iOS

This folder contains the native SwiftUI implementation for the iOS 17+ app.

## Current state

- `project.yml` is the XcodeGen source for the iOS app and unit test targets.
- `DoNotNervous/App/DoNotNervousApp.swift` is the app entry file.
- `Package.swift` exposes the shared SwiftUI, SwiftData, and service code as a Swift package for easier review and unit testing.
- Xcode generates the app Info.plist and injects `DNNAPIBaseURL` from the selected xcconfig.
- `Config/Debug.xcconfig` points simulator builds at `http://localhost:5052`.
- `Config/Release.xcconfig` contains the production API placeholder. Replace it before archiving.

## Generate the Xcode project

```bash
brew install xcodegen
cd ios
xcodegen generate
open DoNotNervous.xcodeproj
```

If Xcode is installed but not selected:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

## Build and test

```bash
cd ios
swift test
xcodebuild test -project DoNotNervous.xcodeproj -scheme DoNotNervous -destination 'platform=iOS Simulator,name=iPhone 16'
```

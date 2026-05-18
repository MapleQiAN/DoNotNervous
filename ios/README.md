# DoNotNervous iOS

This folder contains the native SwiftUI implementation scaffold for the iOS 17+ app.

## Current state

- `DoNotNervous/App/DoNotNervousApp.swift` is the app entry file to use in an Xcode iOS App target.
- `Package.swift` exposes the shared SwiftUI, SwiftData, and service code as a Swift package for easier review and unit testing.
- The workspace is currently Windows-based, so Simulator, Xcode project generation, and TestFlight validation must be done on macOS with Xcode.

## Import into Xcode

1. Create a new iOS App target named `DoNotNervous`.
2. Set the minimum deployment target to iOS 17.
3. Add the `ios/DoNotNervous` source folder to the target.
4. Keep `DoNotNervous/App/DoNotNervousApp.swift` in the app target; it is intentionally excluded from the Swift package library target.
5. Add `ios/DoNotNervousTests` to the unit test target.

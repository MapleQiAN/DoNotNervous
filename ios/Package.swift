// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "DoNotNervousIOS",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "DoNotNervousIOS", targets: ["DoNotNervousIOS"])
    ],
    targets: [
        .target(
            name: "DoNotNervousIOS",
            path: "DoNotNervous",
            exclude: ["App/DoNotNervousApp.swift", "Resources/Info.plist", "Resources/README.md"]
        ),
        .testTarget(
            name: "DoNotNervousIOSTests",
            dependencies: ["DoNotNervousIOS"],
            path: "DoNotNervousTests"
        )
    ]
)

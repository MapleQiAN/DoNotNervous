import XCTest
@testable import DoNotNervousIOS

final class AppConfigurationTests: XCTestCase {
    func testEnvironmentAPIURLOverridesBundleValue() {
        let url = AppConfiguration.resolveAPIBaseURL(
            infoDictionary: ["DNNAPIBaseURL": "https://bundle.example.com"],
            environment: ["DNN_API_BASE_URL": "https://api.example.com"]
        )

        XCTAssertEqual(url.absoluteString, "https://api.example.com")
    }

    func testBundleAPIURLIsUsedWhenEnvironmentIsEmpty() {
        let url = AppConfiguration.resolveAPIBaseURL(
            infoDictionary: ["DNNAPIBaseURL": "https://bundle.example.com"],
            environment: [:]
        )

        XCTAssertEqual(url.absoluteString, "https://bundle.example.com")
    }

    func testPlaceholderBuildSettingFallsBackToLocalDevelopmentURL() {
        let url = AppConfiguration.resolveAPIBaseURL(
            infoDictionary: ["DNNAPIBaseURL": "$(DNN_API_BASE_URL)"],
            environment: [:]
        )

        XCTAssertEqual(url.absoluteString, "http://localhost:5052")
    }

    func testTrailingSlashIsRemoved() {
        let url = AppConfiguration.resolveAPIBaseURL(
            infoDictionary: [:],
            environment: ["DNN_API_BASE_URL": "https://api.example.com/"]
        )

        XCTAssertEqual(url.absoluteString, "https://api.example.com")
    }
}

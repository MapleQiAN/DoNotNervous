import Foundation

public struct AppConfiguration: Equatable {
    public static let defaultLocalAPIBaseURL = URL(string: "http://localhost:5052")!

    public let apiBaseURL: URL

    public init(apiBaseURL: URL = AppConfiguration.resolveAPIBaseURL()) {
        self.apiBaseURL = apiBaseURL
    }

    public static func resolveAPIBaseURL(
        infoDictionary: [String: Any]? = Bundle.main.infoDictionary,
        environment: [String: String] = ProcessInfo.processInfo.environment
    ) -> URL {
        let candidates = [
            environment["DNN_API_BASE_URL"],
            infoDictionary?["DNNAPIBaseURL"] as? String
        ]

        for candidate in candidates {
            if let url = sanitizedHTTPURL(from: candidate) {
                return url
            }
        }

        return defaultLocalAPIBaseURL
    }

    private static func sanitizedHTTPURL(from rawValue: String?) -> URL? {
        guard let rawValue else { return nil }
        let trimmed = rawValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !trimmed.contains("$(") else { return nil }

        let withoutTrailingSlash = trimmed.hasSuffix("/")
            ? String(trimmed.dropLast())
            : trimmed
        guard
            let url = URL(string: withoutTrailingSlash),
            let scheme = url.scheme?.lowercased(),
            scheme == "http" || scheme == "https",
            url.host?.isEmpty == false
        else {
            return nil
        }

        return url
    }
}

import Foundation

public struct AuthUser: Codable, Equatable {
    public let id: String
    public let email: String
}

public struct AuthResponse: Codable, Equatable {
    public let user: AuthUser
    public let accessToken: String
    public let refreshToken: String
}

public actor AuthService {
    private let baseURL: URL
    private let tokenStore: KeychainTokenStore

    public init(
        baseURL: URL = AppConfiguration().apiBaseURL,
        tokenStore: KeychainTokenStore = KeychainTokenStore()
    ) {
        self.baseURL = baseURL
        self.tokenStore = tokenStore
    }

    @discardableResult
    public func login(email: String, password: String) async throws -> AuthResponse {
        try await authenticate(path: "/auth/login", email: email, password: password)
    }

    @discardableResult
    public func register(email: String, password: String) async throws -> AuthResponse {
        try await authenticate(path: "/auth/register", email: email, password: password)
    }

    public func hasTokens() -> Bool {
        tokenStore.load() != nil
    }

    public func logout() {
        tokenStore.clear()
    }

    private func authenticate(path: String, email: String, password: String) async throws -> AuthResponse {
        var request = URLRequest(url: baseURL.appending(path: path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["email": email, "password": password])

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIError.badResponse
        }

        let result = try JSONDecoder().decode(AuthResponse.self, from: data)
        try tokenStore.save(AuthTokens(accessToken: result.accessToken, refreshToken: result.refreshToken))
        return result
    }
}

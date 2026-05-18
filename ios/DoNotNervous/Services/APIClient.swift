import Foundation

public struct APIEnvelope<T: Decodable>: Decodable {
    public let data: T
}

public actor APIClient {
    public let baseURL: URL
    private let tokenStore: KeychainTokenStore
    private let decoder = JSONDecoder()

    public init(
        baseURL: URL = AppConfiguration().apiBaseURL,
        tokenStore: KeychainTokenStore = KeychainTokenStore()
    ) {
        self.baseURL = baseURL
        self.tokenStore = tokenStore
        decoder.dateDecodingStrategy = .iso8601
    }

    public func get<T: Decodable>(_ path: String, as type: T.Type) async throws -> T {
        try await request(path, method: "GET", body: nil, as: type)
    }

    public func post<T: Decodable, Body: Encodable>(
        _ path: String,
        body: Body,
        as type: T.Type
    ) async throws -> T {
        let data = try JSONEncoder().encode(body)
        return try await request(path, method: "POST", body: data, as: type)
    }

    public func request<T: Decodable>(
        _ path: String,
        method: String,
        body: Data?,
        as type: T.Type
    ) async throws -> T {
        var request = URLRequest(url: baseURL.appending(path: path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = tokenStore.load()?.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIError.badResponse
        }
        return try decoder.decode(T.self, from: data)
    }
}

public enum APIError: Error {
    case badResponse
}

public struct SyncResponse: Decodable {
    public let serverTimestamp: String
    public let changes: [String: [JSONValue]]
}

public enum JSONValue: Decodable, Equatable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode([JSONValue].self) {
            self = .array(value)
        } else {
            self = .object(try container.decode([String: JSONValue].self))
        }
    }
}

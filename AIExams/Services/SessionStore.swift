import Foundation
import SwiftUI

/// Single source of auth truth. The token lives in the Keychain; the user
/// profile (non-secret) in UserDefaults. Tokens from 1.2 and earlier were
/// stored in UserDefaults and are migrated on first launch.
@MainActor
final class SessionStore: ObservableObject {
    @Published private(set) var token: String?
    @Published private(set) var user: User?

    private let tokenKey = "ai-exams-token"
    private let userKey = "ai-exams-user"

    var isSignedIn: Bool { token != nil }

    var api: APIClient {
        APIClient(tokenProvider: { [weak self] in self?.token })
    }

    init() {
        if let legacy = UserDefaults.standard.string(forKey: tokenKey) {
            Keychain.write(legacy, for: tokenKey)
            UserDefaults.standard.removeObject(forKey: tokenKey)
        }
        token = Keychain.read(tokenKey)
        if let data = UserDefaults.standard.data(forKey: userKey) {
            user = try? JSONDecoder().decode(User.self, from: data)
        }
        if token == nil { user = nil }
    }

    func signIn(_ response: AuthResponse) {
        Keychain.write(response.token, for: tokenKey)
        token = response.token
        user = response.user
        if let data = try? JSONEncoder().encode(response.user) {
            UserDefaults.standard.set(data, forKey: userKey)
        }
    }

    func signOut() {
        Keychain.delete(tokenKey)
        UserDefaults.standard.removeObject(forKey: userKey)
        token = nil
        user = nil
    }

    /// Signs out when the server says the token is no longer valid.
    func handle(_ error: Error) -> String {
        if case APIError.unauthorized = error { signOut() }
        if case APIError.missingToken = error { signOut() }
        return error.localizedDescription
    }
}

import Foundation
import SwiftUI

@MainActor
final class SessionStore: ObservableObject {
    @Published private(set) var token: String?
    @Published private(set) var user: User?
    @Published var errorMessage: String?

    private let tokenKey = "ai-exams-token"
    private let userKey = "ai-exams-user"

    var api: APIClient {
        APIClient(tokenProvider: { self.token })
    }

    init() {
        token = UserDefaults.standard.string(forKey: tokenKey)
        if let data = UserDefaults.standard.data(forKey: userKey) {
            user = try? JSONDecoder().decode(User.self, from: data)
        }
    }

    func login(email: String, password: String) async {
        await authenticate { try await api.login(email: email, password: password) }
    }

    func register(name: String, email: String, password: String) async {
        await authenticate { try await api.register(name: name, email: email, password: password) }
    }

    func signOut() {
        token = nil
        user = nil
        UserDefaults.standard.removeObject(forKey: tokenKey)
        UserDefaults.standard.removeObject(forKey: userKey)
    }

    private func authenticate(_ action: () async throws -> AuthResponse) async {
        do {
            let response = try await action()
            token = response.token
            user = response.user
            UserDefaults.standard.set(response.token, forKey: tokenKey)
            if let data = try? JSONEncoder().encode(response.user) {
                UserDefaults.standard.set(data, forKey: userKey)
            }
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

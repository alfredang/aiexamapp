import AuthenticationServices
import CryptoKit
import SwiftUI

/// Google (via the backend + a secure browser sheet) and Sign in with Apple.
/// Both finish with an `AuthResponse` the caller hands to `SessionStore.signIn`.
@MainActor
final class SocialSignIn: NSObject, ObservableObject, ASWebAuthenticationPresentationContextProviding {
    private var appleNonce = ""

    // MARK: Google

    func google(api: APIClient) async throws -> AuthResponse {
        let verifier = Self.randomString(48)
        let challenge = Data(SHA256.hash(data: Data(verifier.utf8))).base64URL
        var comps = URLComponents(url: api.baseURL.appendingPathComponent("api/mobile/auth/google/start"), resolvingAgainstBaseURL: false)!
        let state = Self.randomString(24, alphabet: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
        comps.queryItems = [URLQueryItem(name: "code_challenge", value: challenge), URLQueryItem(name: "state", value: state)]

        let callback: URL = try await withCheckedThrowingContinuation { cont in
            let session = ASWebAuthenticationSession(url: comps.url!, callbackURLScheme: "aiexams") { url, error in
                if let url { cont.resume(returning: url) }
                else if (error as? ASWebAuthenticationSessionError)?.code == .canceledLogin { cont.resume(throwing: CancellationError()) }
                else { cont.resume(throwing: error ?? APIError.offline) }
            }
            session.presentationContextProvider = self
            // Ephemeral: no "wants to sign in" prompt and no leftover website session.
            session.prefersEphemeralWebBrowserSession = true
            if !session.start() { cont.resume(throwing: APIError.server("Could not open Google sign-in.", status: 0)) }
        }

        let items = URLComponents(url: callback, resolvingAgainstBaseURL: false)?.queryItems ?? []
        if let message = items.first(where: { $0.name == "error" })?.value { throw APIError.server(message, status: 0) }
        guard items.first(where: { $0.name == "state" })?.value == state,
              let code = items.first(where: { $0.name == "code" })?.value else {
            throw APIError.server("Google sign-in failed. Please try again.", status: 0)
        }
        return try await api.exchangeGoogleCode(code, verifier: verifier)
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { ($0 as? UIWindowScene)?.keyWindow }
            .first ?? ASPresentationAnchor()
    }

    // MARK: Apple

    func prepareApple(_ request: ASAuthorizationAppleIDRequest) {
        appleNonce = Self.randomString(32)
        request.requestedScopes = [.fullName, .email]
        request.nonce = Data(SHA256.hash(data: Data(appleNonce.utf8))).map { String(format: "%02x", $0) }.joined()
    }

    func apple(_ result: Result<ASAuthorization, Error>, api: APIClient) async throws -> AuthResponse {
        switch result {
        case .failure(let error):
            if (error as? ASAuthorizationError)?.code == .canceled { throw CancellationError() }
            throw error
        case .success(let auth):
            guard let credential = auth.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken,
                  let token = String(data: tokenData, encoding: .utf8) else {
                throw APIError.server("Apple sign-in failed. Please try again.", status: 0)
            }
            let parts = [credential.fullName?.givenName, credential.fullName?.familyName].compactMap { $0 }
            let name = parts.isEmpty ? nil : parts.joined(separator: " ")
            return try await api.appleSignIn(identityToken: token, nonce: appleNonce, fullName: name)
        }
    }

    private static func randomString(_ length: Int, alphabet: String = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~") -> String {
        let chars = Array(alphabet)
        var rng = SystemRandomNumberGenerator()
        return String((0..<length).map { _ in chars.randomElement(using: &rng)! })
    }
}

private extension Data {
    var base64URL: String {
        base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
    }
}

import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case missingToken
    case server(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: "Invalid server URL."
        case .missingToken: "Please sign in again."
        case .server(let message): message
        }
    }
}

struct APIClient {
    var baseURL = URL(string: "https://exams.tertiaryinfotech.com")!
    var tokenProvider: () -> String?

    func login(email: String, password: String) async throws -> AuthResponse {
        try await send("/api/mobile/auth/login", method: "POST", body: ["email": email, "password": password], authorized: false)
    }

    func register(name: String, email: String, password: String) async throws -> AuthResponse {
        try await send("/api/mobile/auth/register", method: "POST", body: ["name": name, "email": email, "password": password], authorized: false)
    }

    func catalog(query: String = "", vendor: String? = nil) async throws -> CatalogResponse {
        var components = URLComponents(url: baseURL.appending(path: "/api/mobile/catalog"), resolvingAgainstBaseURL: false)!
        components.queryItems = [
            query.isEmpty ? nil : URLQueryItem(name: "q", value: query),
            vendor == nil ? nil : URLQueryItem(name: "vendor", value: vendor)
        ].compactMap { $0 }
        guard let url = components.url else { throw APIError.invalidURL }
        return try await send(url: url, method: "GET", bodyData: nil, authorized: false)
    }

    func library() async throws -> LibraryResponse {
        try await send("/api/mobile/library", method: "GET", body: Optional<String>.none)
    }

    func startAttempt(examId: String, mode: ExamMode, teaser: Bool = false) async throws -> StartAttemptResponse {
        try await send("/api/mobile/attempts/start", method: "POST", body: StartAttemptRequest(examId: examId, mode: mode, teaser: teaser))
    }

    func attempt(id: String) async throws -> AttemptResponse {
        try await send("/api/mobile/attempts/\(id)", method: "GET", body: Optional<String>.none)
    }

    func answer(attemptId: String, questionId: String, answer: [String], flagged: Bool?) async throws -> AnswerResponse {
        try await send("/api/mobile/attempts/answer", method: "POST", body: AnswerRequest(attemptId: attemptId, questionId: questionId, answer: answer, flagged: flagged))
    }

    func submit(attemptId: String) async throws -> AttemptScore {
        try await send("/api/mobile/attempts/submit", method: "POST", body: SubmitRequest(attemptId: attemptId))
    }

    func deleteAccount() async throws -> DeleteAccountResponse {
        try await send("/api/mobile/account", method: "DELETE", body: Optional<String>.none)
    }

    // MARK: Staff (claims + timesheet) — see docs/STAFF_API.md for the backend contract.

    func claims() async throws -> ClaimsListResponse {
        try await send("/api/mobile/staff/claims", method: "GET", body: Optional<String>.none)
    }

    func submitClaim(_ claim: SubmitClaimRequest) async throws -> ClaimResponse {
        try await send("/api/mobile/staff/claims", method: "POST", body: claim)
    }

    func timesheet() async throws -> TimesheetResponse {
        try await send("/api/mobile/staff/timesheet", method: "GET", body: Optional<String>.none)
    }

    func clockIn(note: String? = nil) async throws -> ClockResponse {
        try await send("/api/mobile/staff/timesheet/clock-in", method: "POST", body: ClockRequest(note: note))
    }

    func clockOut(note: String? = nil) async throws -> ClockResponse {
        try await send("/api/mobile/staff/timesheet/clock-out", method: "POST", body: ClockRequest(note: note))
    }

    private func send<T: Decodable, B: Encodable>(_ path: String, method: String, body: B?, authorized: Bool = true) async throws -> T {
        let url = baseURL.appending(path: path)
        let bodyData = try body.map { try JSONEncoder().encode($0) }
        return try await send(url: url, method: method, bodyData: bodyData, authorized: authorized)
    }

    private func send<T: Decodable>(url: URL, method: String, bodyData: Data?, authorized: Bool = true) async throws -> T {
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let bodyData {
            request.httpBody = bodyData
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        if authorized {
            guard let token = tokenProvider() else { throw APIError.missingToken }
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        if !(200..<300).contains(status) {
            let message = (try? JSONDecoder().decode(ServerError.self, from: data).error) ?? "Server returned HTTP \(status)."
            throw APIError.server(message)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}

private struct ServerError: Codable {
    let error: String
}

struct DeleteAccountResponse: Codable {
    let ok: Bool
}

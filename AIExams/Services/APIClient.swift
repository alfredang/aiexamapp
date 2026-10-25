import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case missingToken
    case unauthorized
    case server(String, status: Int)
    case offline

    var errorDescription: String? {
        switch self {
        case .invalidURL: "Invalid server URL."
        case .missingToken, .unauthorized: "Your session has ended. Please sign in again."
        case .server(let message, _): message
        case .offline: "You appear to be offline. Check your connection and try again."
        }
    }
}

struct APIClient {
    var baseURL = URL(string: "https://exams.tertiaryinfotech.com")!
    var tokenProvider: () -> String?

    // MARK: Auth

    func requestCode(email: String, purpose: CodePurpose, name: String? = nil) async throws -> OkResponse {
        try await send("/api/mobile/auth/code/request", method: "POST",
                       body: CodeRequest(email: email, purpose: purpose, name: name), authorized: false)
    }

    func verifyCode(email: String, code: String, purpose: CodePurpose) async throws -> AuthResponse {
        try await send("/api/mobile/auth/code/verify", method: "POST",
                       body: CodeVerify(email: email, code: code, purpose: purpose), authorized: false)
    }

    func login(email: String, password: String) async throws -> AuthResponse {
        try await send("/api/mobile/auth/login", method: "POST", body: ["email": email, "password": password], authorized: false)
    }

    // MARK: Exams

    func library() async throws -> LibraryResponse {
        try await send("/api/mobile/library", method: "GET", body: Optional<String>.none)
    }

    func history() async throws -> HistoryResponse {
        try await send("/api/mobile/attempts", method: "GET", body: Optional<String>.none)
    }

    func startAttempt(examId: String, mode: ExamMode) async throws -> StartAttemptResponse {
        try await send("/api/mobile/attempts/start", method: "POST", body: StartAttemptRequest(examId: examId, mode: mode))
    }

    func attempt(id: String) async throws -> AttemptResponse {
        try await send("/api/mobile/attempts/\(id)", method: "GET", body: Optional<String>.none)
    }

    func answer(attemptId: String, questionId: String, answer: [String], flagged: Bool?) async throws -> AnswerResponse {
        try await send("/api/mobile/attempts/answer", method: "POST",
                       body: AnswerRequest(attemptId: attemptId, questionId: questionId, answer: answer, flagged: flagged))
    }

    func mark(attemptId: String, questionId: String, flagged: Bool) async throws -> OkResponse {
        try await send("/api/mobile/attempts/mark", method: "POST",
                       body: MarkRequest(attemptId: attemptId, questionId: questionId, flagged: flagged))
    }

    func submit(attemptId: String) async throws -> SubmitResponse {
        try await send("/api/mobile/attempts/submit", method: "POST", body: SubmitRequest(attemptId: attemptId))
    }

    func deleteAccount() async throws -> OkResponse {
        try await send("/api/mobile/account", method: "DELETE", body: Optional<String>.none)
    }

    // MARK: Transport

    private func send<T: Decodable, B: Encodable>(_ path: String, method: String, body: B?, authorized: Bool = true) async throws -> T {
        let url = baseURL.appending(path: path)
        let bodyData = try body.map { try JSONEncoder().encode($0) }
        var request = URLRequest(url: url, timeoutInterval: 30)
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

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch let error as URLError where [.notConnectedToInternet, .networkConnectionLost, .timedOut, .cannotFindHost].contains(error.code) {
            throw APIError.offline
        }
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        if authorized && status == 401 { throw APIError.unauthorized }
        if !(200..<300).contains(status) {
            let message = (try? JSONDecoder().decode(ServerError.self, from: data).error) ?? "Something went wrong (HTTP \(status)). Please try again."
            throw APIError.server(message, status: status)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}

private struct ServerError: Codable {
    let error: String
}

private struct CodeRequest: Codable {
    let email: String
    let purpose: CodePurpose
    let name: String?
}

private struct CodeVerify: Codable {
    let email: String
    let code: String
    let purpose: CodePurpose
}

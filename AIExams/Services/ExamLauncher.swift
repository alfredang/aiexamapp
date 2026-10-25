import SwiftUI

/// Opens an attempt full-screen from any tab, and tells the lists to refresh
/// when the candidate comes back.
@MainActor
final class ExamLauncher: ObservableObject {
    struct Route: Identifiable, Equatable {
        let id: String
        var showResults = false
    }

    @Published var active: Route?
    /// Bumped whenever an attempt closes, so lists reload scores.
    @Published private(set) var refreshCount = 0
    @Published var startingKey: String?
    @Published var errorMessage: String?

    func open(attemptId: String, results: Bool = false) {
        active = Route(id: attemptId, showResults: results)
    }

    func closed() { refreshCount += 1 }

    /// Resume the newest unfinished attempt in this mode, or start a fresh one.
    func start(examId: String, mode: ExamMode, resume: HistoryAttempt?, session: SessionStore) async {
        if let resume {
            open(attemptId: resume.id)
            return
        }
        startingKey = "\(examId)-\(mode.rawValue)"
        defer { startingKey = nil }
        do {
            let response = try await session.api.startAttempt(examId: examId, mode: mode)
            open(attemptId: response.attemptId)
        } catch {
            errorMessage = session.handle(error)
        }
    }
}

#if DEBUG
import SwiftUI

/// Debug-only driver for App Store screenshots in the Simulator, where
/// synthetic taps are unreliable. Configure with environment variables
/// (`SIMCTL_CHILD_*` on `simctl launch`):
///   SHOT_EMAIL / SHOT_PASSWORD — sign in with a password if signed out
///   SHOT_SMART=1 — play-practice re-answers most questions with the revealed
///     key, for a realistic passing score in screenshots
///   SHOT_ROUTE — exam | review | practice | results | history | account,
///     or play-exam / play-practice to answer, flag, review and submit a whole
///     attempt through the runner's own code (end-to-end check)
/// Not compiled into Release builds.
@MainActor
enum ScreenshotAutomation {
    static var route: String? { ProcessInfo.processInfo.environment["SHOT_ROUTE"] }
    static var smart: Bool { ProcessInfo.processInfo.environment["SHOT_SMART"] == "1" }

    private static var didRun = false

    static func run(session: SessionStore, launcher: ExamLauncher) async {
        // The hosting .task restarts when sign-in swaps the root view; act once.
        guard !didRun else { return }
        didRun = true
        let env = ProcessInfo.processInfo.environment
        if !session.isSignedIn, let email = env["SHOT_EMAIL"], let password = env["SHOT_PASSWORD"] {
            if let r = try? await session.api.login(email: email, password: password) { session.signIn(r) }
        }
        guard session.isSignedIn, let route else { return }
        try? await Task.sleep(for: .seconds(1))
        switch route {
        case "exam", "review", "practice", "play-exam", "play-practice":
            let mode: ExamMode = route.hasSuffix("practice") ? .practice : .exam
            guard let exam = try? await session.api.library().exams.first else { return }
            let resume = try? await session.api.history().attempts.first { $0.examId == exam.examId && $0.mode == mode && $0.isResumable }
            await launcher.start(examId: exam.examId, mode: mode, resume: resume, session: session)
        case "results":
            if let done = try? await session.api.history().attempts.first(where: { !$0.inProgress && !$0.isTeaser }) {
                launcher.open(attemptId: done.id, results: true)
            }
        default:
            break
        }
    }

    static var initialTab: Int {
        switch route {
        case "history": 1
        case "account": 2
        default: 0
        }
    }
}
#endif

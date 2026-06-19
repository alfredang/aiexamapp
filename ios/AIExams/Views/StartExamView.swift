import SwiftUI

struct StartExamView: View {
    @EnvironmentObject private var session: SessionStore
    let examId: String
    let title: String
    let code: String
    let mode: ExamMode
    let teaser: Bool

    @State private var attemptRoute: AttemptRoute?
    @State private var isStarting = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 8) {
                Text(code)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Theme.primary)
                Text(title)
                    .font(.title2.weight(.bold))
                Text(teaser ? "Free teaser" : mode == .practice ? "Practice mode reveals explanations after each answer." : "Exam mode is timed and reveals results after submission.")
                    .foregroundStyle(Theme.mutedInk)
            }
            .appCard()

            if let errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }

            Button {
                Task { await start() }
            } label: {
                HStack {
                    Spacer()
                    if isStarting { ProgressView() }
                    Text(teaser ? "Start Free Teaser" : "Start \(mode.title) Mode")
                    Spacer()
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(Theme.primary)
            .disabled(isStarting)

            Spacer()
        }
        .padding()
        .background(Theme.background)
        .navigationDestination(item: $attemptRoute) { route in
            ExamRunnerView(attemptId: route.id)
        }
    }

    private func start() async {
        isStarting = true
        defer { isStarting = false }
        do {
            let response = try await session.api.startAttempt(examId: examId, mode: mode, teaser: teaser)
            attemptRoute = AttemptRoute(id: response.attemptId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct AttemptRoute: Identifiable, Hashable {
    let id: String
}

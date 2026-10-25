import SwiftUI

/// My Exams: every practice exam the account owns, with best/latest score and
/// one tap into Exam mode (timed, primary) or Practice mode.
struct LibraryView: View {
    @EnvironmentObject private var session: SessionStore
    @EnvironmentObject private var launcher: ExamLauncher
    @State private var exams: [LibraryExam]?
    @State private var history: HistoryResponse?
    @State private var errorMessage: String?
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            Group {
                if let exams {
                    if exams.isEmpty {
                        ScrollView {
                            ContentUnavailableView(
                                "No practice exams yet",
                                systemImage: "books.vertical",
                                description: Text("Practice exams linked to \(session.user?.email ?? "your account") appear here. Pull down to refresh.")
                            )
                            .padding(.top, 60)
                        }
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 16) {
                                if let name = session.user?.name, !name.isEmpty {
                                    Text("Welcome back, \(name.split(separator: " ").first.map(String.init) ?? name)")
                                        .font(.title3.weight(.semibold))
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                }
                                ForEach(exams) { exam in
                                    ExamCard(exam: exam, summary: summary(for: exam), attempts: attempts(for: exam))
                                }
                            }
                            .padding()
                            .readableWidth()
                        }
                    }
                } else if isLoading {
                    ProgressView("Loading your exams…")
                } else {
                    ContentUnavailableView {
                        Label("Couldn't load your exams", systemImage: "wifi.exclamationmark")
                    } description: {
                        Text(errorMessage ?? "Please try again.")
                    } actions: {
                        Button("Try again") { Task { await load() } }
                            .buttonStyle(.borderedProminent)
                    }
                }
            }
            .background(Theme.background)
            .navigationTitle("My Exams")
            .refreshable { await load() }
            .task { await load() }
            .onChange(of: launcher.refreshCount) { Task { await load() } }
        }
    }

    private func summary(for exam: LibraryExam) -> ExamSummary? {
        history?.exams.first { $0.examId == exam.examId }
    }

    private func attempts(for exam: LibraryExam) -> [HistoryAttempt] {
        history?.attempts.filter { $0.examId == exam.examId && !$0.isTeaser } ?? []
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            async let lib = session.api.library()
            async let hist = session.api.history()
            let (l, h) = try await (lib, hist)
            exams = l.exams
            history = h
            errorMessage = nil
        } catch {
            errorMessage = session.handle(error)
        }
    }
}

private struct ExamCard: View {
    @EnvironmentObject private var session: SessionStore
    @EnvironmentObject private var launcher: ExamLauncher
    let exam: LibraryExam
    let summary: ExamSummary?
    let attempts: [HistoryAttempt]

    private func resumable(_ mode: ExamMode) -> HistoryAttempt? {
        attempts.first { $0.mode == mode && $0.isResumable }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .firstTextBaseline) {
                Text(exam.code)
                    .font(.caption.weight(.bold).monospaced())
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(Theme.primary.opacity(0.12), in: Capsule())
                    .foregroundStyle(Theme.primary)
                Text(exam.vendorName)
                    .font(.caption)
                    .foregroundStyle(Theme.mutedInk)
                Spacer()
            }
            Text(exam.examTitle)
                .font(.headline)
                .fixedSize(horizontal: false, vertical: true)
            Text("\(exam.questionCount) questions · \(exam.durationMinutes) min in Exam mode")
                .font(.subheadline)
                .foregroundStyle(Theme.mutedInk)

            if let summary, summary.attemptCount > 0 {
                HStack(spacing: 0) {
                    stat("Best", percentText(summary.best), good: (summary.best ?? -1) >= summary.passingScore)
                    stat("Latest", percentText(summary.latest), good: (summary.latest ?? -1) >= summary.passingScore)
                    stat("Attempts", "\(summary.attemptCount)", good: false)
                }
                .padding(.vertical, 4)
            }

            VStack(spacing: 10) {
                modeButton(.exam)
                modeButton(.practice)
            }
        }
        .appCard()
    }

    private func stat(_ label: String, _ value: String, good: Bool) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased()).font(.caption2.weight(.semibold)).foregroundStyle(Theme.mutedInk)
            Text(value).font(.title3.weight(.bold).monospacedDigit()).foregroundStyle(good ? Theme.pass : Theme.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private func modeButton(_ mode: ExamMode) -> some View {
        let resume = resumable(mode)
        let starting = launcher.startingKey == "\(exam.examId)-\(mode.rawValue)"
        let title = resume != nil ? "Resume \(mode.title)" : mode == .exam ? "Start Exam mode (timed)" : "Start Practice mode"
        let action = { Task { await launcher.start(examId: exam.examId, mode: mode, resume: resume, session: session) } }
        let label = HStack(spacing: 8) {
            if starting { ProgressView().tint(mode == .exam ? .white : Theme.primary) }
            Image(systemName: mode == .exam ? "timer" : "lightbulb")
            Text(title)
        }
        if mode == .exam {
            Button(action: { _ = action() }) { label }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(launcher.startingKey != nil)
        } else {
            Button(action: { _ = action() }) { label }
                .buttonStyle(SecondaryButtonStyle())
                .disabled(launcher.startingKey != nil)
        }
    }
}

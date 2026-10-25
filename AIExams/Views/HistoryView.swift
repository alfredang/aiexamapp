import SwiftUI

/// Exam history: per-certification best / average / latest and domain weak
/// spots, then every attempt. Submitted attempts open the score report;
/// unfinished ones can be resumed.
struct HistoryView: View {
    @EnvironmentObject private var session: SessionStore
    @EnvironmentObject private var launcher: ExamLauncher
    @State private var history: HistoryResponse?
    @State private var errorMessage: String?
    @State private var isLoading = false
    @State private var filter: String?

    var body: some View {
        NavigationStack {
            Group {
                if let history {
                    content(history)
                } else if isLoading {
                    ProgressView("Loading history…")
                } else {
                    ContentUnavailableView {
                        Label("Couldn't load history", systemImage: "wifi.exclamationmark")
                    } description: {
                        Text(errorMessage ?? "Please try again.")
                    } actions: {
                        Button("Try again") { Task { await load() } }.buttonStyle(.borderedProminent)
                    }
                }
            }
            .background(Theme.background)
            .navigationTitle("History")
            .refreshable { await load() }
            .task { await load() }
            .onChange(of: launcher.refreshCount) { Task { await load() } }
        }
    }

    @ViewBuilder
    private func content(_ history: HistoryResponse) -> some View {
        let attempts = history.attempts.filter { !$0.isTeaser }
        let exams = history.exams.filter { e in attempts.contains { $0.examId == e.examId } }
        if attempts.isEmpty {
            ScrollView {
                ContentUnavailableView("No attempts yet", systemImage: "chart.line.uptrend.xyaxis",
                                       description: Text("Finish a practice exam and your scores show up here."))
                    .padding(.top, 60)
            }
        } else {
            let shown = filter.map { id in attempts.filter { $0.examId == id } } ?? attempts
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if exams.count > 1 {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                chip("All · \(attempts.count)", selected: filter == nil) { filter = nil }
                                ForEach(exams) { e in
                                    chip("\(e.code) · \(e.attemptCount)", selected: filter == e.examId) { filter = e.examId }
                                }
                            }
                        }
                    }
                    ForEach(exams.filter { filter == nil || $0.examId == filter }) { SummaryCard(summary: $0) }

                    Text("Attempts").font(.headline).padding(.top, 4)
                    VStack(spacing: 0) {
                        ForEach(shown) { attempt in
                            Button {
                                // Unfinished attempts reopen the runner, which submits an expired one.
                                launcher.open(attemptId: attempt.id, results: !attempt.inProgress)
                            } label: {
                                AttemptRow(attempt: attempt, showExam: filter == nil && exams.count > 1)
                            }
                            .buttonStyle(.plain)
                            if attempt.id != shown.last?.id { Divider().padding(.leading, 16) }
                        }
                    }
                    .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .padding()
                .readableWidth()
            }
        }
    }

    private func chip(_ title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.weight(.semibold).monospaced())
                .padding(.horizontal, 14)
                .frame(minHeight: 40)
                .background(selected ? Theme.navy : Theme.surface, in: Capsule())
                .foregroundStyle(selected ? .white : Theme.ink)
        }
        .buttonStyle(.plain)
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            history = try await session.api.history()
            errorMessage = nil
        } catch {
            errorMessage = session.handle(error)
        }
    }
}

private struct SummaryCard: View {
    let summary: ExamSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(summary.vendorName.uppercased()).font(.caption.weight(.semibold)).foregroundStyle(Theme.mutedInk)
            Text(summary.title).font(.headline).fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 0) {
                stat("Best", summary.best)
                stat("Average", summary.average)
                stat("Latest", summary.latest)
            }
            let weak = summary.domains.filter { $0.percent < summary.passingScore }.prefix(3)
            if !weak.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Focus on").font(.subheadline.weight(.semibold))
                    ForEach(Array(weak), id: \.name) { d in
                        DomainBar(name: d.name, correct: d.correct, total: d.total, passMark: summary.passingScore)
                    }
                }
            }
            Text("Pass mark \(summary.passingScore)%").font(.caption).foregroundStyle(Theme.mutedInk)
        }
        .appCard()
    }

    private func stat(_ label: String, _ value: Int?) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased()).font(.caption2.weight(.semibold)).foregroundStyle(Theme.mutedInk)
            Text(percentText(value))
                .font(.title2.weight(.bold).monospacedDigit())
                .foregroundStyle((value ?? -1) >= summary.passingScore ? Theme.pass : Theme.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct AttemptRow: View {
    let attempt: HistoryAttempt
    var showExam = false

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                if showExam {
                    Text(attempt.examCode).font(.caption.weight(.bold).monospaced()).foregroundStyle(Theme.primary)
                }
                Text(attempt.mode == .exam ? "Exam mode" : "Practice mode").font(.subheadline.weight(.semibold))
                if let date = attempt.startedDate {
                    Text(date.formatted(date: .abbreviated, time: .shortened)).font(.caption).foregroundStyle(Theme.mutedInk)
                }
            }
            Spacer()
            if attempt.inProgress {
                Text(attempt.isResumable ? "Resume" : "Unfinished")
                    .font(.caption.weight(.bold))
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(Theme.highlight.opacity(0.18), in: Capsule())
                    .foregroundStyle(Theme.highlight)
            } else {
                VStack(alignment: .trailing, spacing: 2) {
                    Text(percentText(attempt.score)).font(.headline.monospacedDigit())
                    Text("\(attempt.correct)/\(attempt.total)").font(.caption.monospacedDigit()).foregroundStyle(Theme.mutedInk)
                }
                PassBadge(passed: attempt.passed ?? false, compact: true)
            }
            Image(systemName: "chevron.right").font(.caption).foregroundStyle(Theme.mutedInk)
        }
        .padding(.horizontal, 16)
        .frame(minHeight: 64)
        .contentShape(Rectangle())
    }
}

struct PassBadge: View {
    let passed: Bool
    var compact = false

    var body: some View {
        Text(passed ? "PASS" : "FAIL")
            .font(compact ? .caption.weight(.heavy) : .title.weight(.heavy))
            .padding(.horizontal, compact ? 8 : 18)
            .padding(.vertical, compact ? 4 : 8)
            .background((passed ? Theme.pass : Theme.fail).opacity(0.14), in: RoundedRectangle(cornerRadius: 8))
            .foregroundStyle(passed ? Theme.pass : Theme.fail)
            .accessibilityLabel(passed ? "Passed" : "Failed")
    }
}

struct DomainBar: View {
    let name: String
    let correct: Int
    let total: Int
    let passMark: Int

    private var percent: Int { total == 0 ? 0 : Int((Double(correct) / Double(total) * 100).rounded()) }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline) {
                Text(name).font(.subheadline).fixedSize(horizontal: false, vertical: true)
                Spacer()
                Text("\(percent)% · \(correct)/\(total)").font(.caption.monospacedDigit()).foregroundStyle(Theme.mutedInk)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.line.opacity(0.4))
                    Capsule().fill(percent >= passMark ? Theme.pass : Theme.fail)
                        .frame(width: geo.size.width * CGFloat(percent) / 100)
                }
            }
            .frame(height: 8)
        }
        .accessibilityElement(children: .combine)
    }
}

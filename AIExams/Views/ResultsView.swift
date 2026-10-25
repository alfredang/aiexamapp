import SwiftUI

/// Score report: correct/total with PASS/FAIL, domains weakest first, and every
/// question reviewed against the answer key (filter All / Missed / Flagged).
struct ResultsView: View {
    @EnvironmentObject private var session: SessionStore
    let attemptId: String
    let onRetake: (String) -> Void

    private enum Filter: String, CaseIterable, Identifiable {
        case all = "All", missed = "Missed", flagged = "Flagged"
        var id: String { rawValue }
    }

    @State private var payload: AttemptResponse?
    @State private var errorMessage: String?
    @State private var filter: Filter = .all
    @State private var retaking = false
    @State private var actionError: String?

    var body: some View {
        Group {
            if let payload {
                report(payload)
            } else if let errorMessage {
                ContentUnavailableView {
                    Label("Couldn't load results", systemImage: "wifi.exclamationmark")
                } description: { Text(errorMessage) } actions: {
                    Button("Try again") { Task { await load() } }.buttonStyle(.borderedProminent)
                }
            } else {
                ProgressView("Scoring…")
            }
        }
        .background(Theme.background)
        .navigationTitle("Results")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .alert("Couldn't start a new attempt", isPresented: Binding(get: { actionError != nil }, set: { if !$0 { actionError = nil } })) {
            Button("OK", role: .cancel) {}
        } message: { Text(actionError ?? "") }
    }

    private func report(_ p: AttemptResponse) -> some View {
        let total = p.result?.total ?? p.questions.count
        let correct = p.result?.correctCount ?? p.questions.filter { isCorrect($0, p) }.count
        let score = Int((p.result?.score ?? p.attempt.score ?? 0).rounded())
        let passed = p.attempt.passed ?? (score >= p.exam.passingScore)
        let domains = (p.result?.perDomain ?? [:])
            .map { (name: $0.key, correct: $0.value.correct, total: $0.value.total) }
            .sorted { Double($0.correct) / Double(max($0.total, 1)) < Double($1.correct) / Double(max($1.total, 1)) }
        let shown = p.questions.enumerated().filter { _, q in
            switch filter {
            case .all: true
            case .missed: !isCorrect(q, p)
            case .flagged: p.attempt.responses[q.id]?.flagged ?? false
            }
        }

        return ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("\(p.exam.code.strippingVariant) · \(p.attempt.mode == .exam ? "Exam mode" : "Practice mode")")
                        .font(.caption.weight(.bold).monospaced()).foregroundStyle(Theme.primary)
                    Text(p.exam.title).font(.headline).fixedSize(horizontal: false, vertical: true)
                    HStack(alignment: .center) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(correct) / \(total)").font(.system(size: 44, weight: .bold).monospacedDigit())
                            Text("\(score)% · pass mark \(p.exam.passingScore)%").font(.subheadline).foregroundStyle(Theme.mutedInk)
                        }
                        Spacer()
                        PassBadge(passed: passed)
                    }
                    Button {
                        Task { await retake(p) }
                    } label: {
                        HStack { if retaking { ProgressView().tint(.white) }; Image(systemName: "arrow.counterclockwise"); Text("Retake exam") }
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(retaking)
                }
                .appCard()

                if !domains.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("By exam domain").font(.headline)
                        Text("Weakest first").font(.caption).foregroundStyle(Theme.mutedInk)
                        ForEach(domains, id: \.name) { d in
                            VStack(alignment: .leading, spacing: 4) {
                                DomainBar(name: d.name, correct: d.correct, total: d.total, passMark: p.exam.passingScore)
                                if d.total - d.correct >= 2 {
                                    Text("NEXT STUDY TARGET").font(.caption2.weight(.heavy).monospaced()).foregroundStyle(Theme.fail)
                                }
                            }
                        }
                    }
                    .appCard()
                }

                Text("Review your answers").font(.headline).padding(.top, 4)
                Picker("Filter", selection: $filter) {
                    ForEach(Filter.allCases) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)

                if shown.isEmpty {
                    Text(filter == .missed ? "No missed questions — nice work." : "No flagged questions.")
                        .font(.subheadline).foregroundStyle(Theme.mutedInk).padding(.vertical, 8)
                }
                ForEach(shown, id: \.element.id) { i, q in
                    ReviewCard(number: i + 1, question: q, response: p.attempt.responses[q.id], correct: isCorrect(q, p))
                }
            }
            .padding(16)
            .readableWidth()
        }
    }

    /// Display only — the score itself always comes from the server.
    private func isCorrect(_ q: Question, _ p: AttemptResponse) -> Bool {
        let answer = p.attempt.responses[q.id]?.answer ?? []
        guard let key = q.correct, !answer.isEmpty else { return false }
        return q.type == .ordering ? answer == key : Set(answer) == Set(key)
    }

    private func load() async {
        errorMessage = nil
        do {
            payload = try await session.api.attempt(id: attemptId)
        } catch {
            errorMessage = session.handle(error)
        }
    }

    private func retake(_ p: AttemptResponse) async {
        retaking = true
        defer { retaking = false }
        do {
            let r = try await session.api.startAttempt(examId: p.exam.id, mode: p.attempt.mode)
            onRetake(r.attemptId)
        } catch {
            actionError = session.handle(error)
        }
    }
}

private struct ReviewCard: View {
    let number: Int
    let question: Question
    let response: SavedResponse?
    let correct: Bool

    private var answer: [String] { response?.answer ?? [] }
    private var key: [String] { question.correct ?? [] }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Question \(number)").font(.subheadline.weight(.semibold)).foregroundStyle(Theme.mutedInk)
                if response?.flagged == true { Image(systemName: "flag.fill").foregroundStyle(Theme.highlight).accessibilityLabel("Flagged") }
                Spacer()
                Label(answer.isEmpty ? "Unanswered" : correct ? "Correct" : "Incorrect",
                      systemImage: correct ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(correct ? Theme.pass : Theme.fail)
            }
            Text(question.stem).font(.body.weight(.medium)).fixedSize(horizontal: false, vertical: true)

            if question.type == .ordering {
                let steps = question.displayOptions
                ForEach(Array(steps.enumerated()), id: \.element.id) { i, step in
                    Text("Step \(i + 1). \(step.text)").font(.subheadline).fixedSize(horizontal: false, vertical: true)
                }
                Text("Your order: \(seq(answer, steps))").font(.subheadline.weight(.semibold)).foregroundStyle(correct ? Theme.pass : Theme.fail)
                Text("Correct order: \(seq(key, steps))").font(.subheadline.weight(.semibold)).foregroundStyle(Theme.pass)
            } else {
                VStack(spacing: 8) {
                    ForEach(question.displayOptions) { option in
                        let isKey = key.contains(option.id)
                        let picked = answer.contains(option.id)
                        HStack(alignment: .top, spacing: 10) {
                            Image(systemName: isKey ? "checkmark.circle.fill" : picked ? "xmark.circle.fill" : "circle")
                                .foregroundStyle(isKey ? Theme.pass : picked ? Theme.fail : Theme.mutedInk)
                            Text(option.text).font(.subheadline).frame(maxWidth: .infinity, alignment: .leading)
                                .fixedSize(horizontal: false, vertical: true)
                            if picked { Text("Your answer").font(.caption2.weight(.bold)).foregroundStyle(isKey ? Theme.pass : Theme.fail) }
                        }
                        .padding(10)
                        .background((isKey ? Theme.pass : picked ? Theme.fail : .clear).opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(isKey ? Theme.pass : picked ? Theme.fail : Theme.line.opacity(0.5)))
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                if !question.domain.isEmpty { DomainChip(domain: question.domain) }
                if let explanation = question.explanation, !explanation.isEmpty {
                    Text("Why").font(.caption.weight(.heavy)).foregroundStyle(Theme.mutedInk)
                    Text(explanation).font(.subheadline).fixedSize(horizontal: false, vertical: true)
                }
                if let refs = question.references {
                    ForEach(refs, id: \.url) { ref in
                        Link(destination: ref.url) {
                            Label(ref.label ?? ref.url.host() ?? ref.url.absoluteString, systemImage: "link")
                                .font(.footnote).lineLimit(1)
                        }
                        .frame(minHeight: 32)
                    }
                }
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.background, in: RoundedRectangle(cornerRadius: 10))
        }
        .appCard()
    }

    private func seq(_ ids: [String], _ steps: [QuestionOption]) -> String {
        let s = ids.compactMap { id in steps.firstIndex { $0.id == id }.map { "\($0 + 1)" } }.joined(separator: " → ")
        return s.isEmpty ? "—" : s
    }
}

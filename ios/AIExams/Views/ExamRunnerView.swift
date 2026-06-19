import SwiftUI

struct ExamRunnerView: View {
    @EnvironmentObject private var session: SessionStore
    let attemptId: String

    @State private var payload: AttemptResponse?
    @State private var index = 0
    @State private var answers: [String: SavedResponse] = [:]
    @State private var reveal: AnswerResponse?
    @State private var isBusy = false
    @State private var errorMessage: String?
    @State private var submittedScore: AttemptScore?

    var body: some View {
        Group {
            if let payload, !payload.questions.isEmpty {
                runner(payload)
            } else if isBusy {
                ProgressView()
            } else {
                ContentUnavailableView("Attempt unavailable", systemImage: "doc.questionmark", description: Text(errorMessage ?? "Try again."))
            }
        }
        .task { await load() }
        .navigationBarTitleDisplayMode(.inline)
    }

    private func runner(_ payload: AttemptResponse) -> some View {
        let question = payload.questions[index]
        let saved = answers[question.id] ?? SavedResponse(answer: [], flagged: false, timeSpent: nil)

        return VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Text(payload.exam.code)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Theme.primary)
                        Spacer()
                        Text("\(index + 1) / \(payload.questions.count)")
                            .font(.caption)
                            .foregroundStyle(Theme.mutedInk)
                    }

                    Text(question.stem)
                        .font(.headline)
                        .fixedSize(horizontal: false, vertical: true)

                    VStack(spacing: 10) {
                        ForEach(question.options) { option in
                            optionButton(option, question: question, saved: saved)
                        }
                    }

                    if let reveal {
                        VStack(alignment: .leading, spacing: 8) {
                            Label(reveal.isCorrect == true ? "Correct" : "Review", systemImage: reveal.isCorrect == true ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundStyle(reveal.isCorrect == true ? .green : .red)
                            if let explanation = reveal.explanation {
                                Text(explanation)
                                    .font(.subheadline)
                                    .foregroundStyle(Theme.ink)
                            }
                        }
                        .appCard()
                    }

                    if let submittedScore {
                        ResultSummary(score: submittedScore, passingScore: payload.exam.passingScore)
                    }
                }
                .padding()
            }

            Divider()
            HStack {
                Button {
                    index = max(0, index - 1)
                    reveal = nil
                } label: {
                    Label("Previous", systemImage: "chevron.left")
                }
                .disabled(index == 0)

                Spacer()

                Button {
                    Task { await answer(question: question) }
                } label: {
                    Label(payload.attempt.mode == .practice ? "Check" : "Save", systemImage: "checkmark")
                }
                .disabled(saved.answer.isEmpty)

                Button {
                    if index == payload.questions.count - 1 {
                        Task { await submit() }
                    } else {
                        index += 1
                        reveal = nil
                    }
                } label: {
                    Label(index == payload.questions.count - 1 ? "Submit" : "Next", systemImage: index == payload.questions.count - 1 ? "paperplane" : "chevron.right")
                }
            }
            .padding()
            .background(.bar)
        }
    }

    private func optionButton(_ option: QuestionOption, question: Question, saved: SavedResponse) -> some View {
        let selected = saved.answer.contains(option.id)
        return Button {
            var next = saved
            if question.type == .multi {
                next.answer = selected ? next.answer.filter { $0 != option.id } : next.answer + [option.id]
            } else {
                next.answer = [option.id]
            }
            answers[question.id] = next
        } label: {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(selected ? Theme.primary : Theme.mutedInk)
                Text(option.text)
                    .foregroundStyle(Theme.ink)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(12)
            .background(selected ? Theme.primary.opacity(0.10) : Theme.surface, in: RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }

    private func load() async {
        guard payload == nil else { return }
        isBusy = true
        defer { isBusy = false }
        do {
            let loaded = try await session.api.attempt(id: attemptId)
            payload = loaded
            answers = loaded.attempt.responses
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func answer(question: Question) async {
        do {
            let saved = answers[question.id] ?? SavedResponse(answer: [], flagged: false, timeSpent: nil)
            reveal = try await session.api.answer(attemptId: attemptId, questionId: question.id, answer: saved.answer, flagged: saved.flagged)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func submit() async {
        do {
            submittedScore = try await session.api.submit(attemptId: attemptId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct ResultSummary: View {
    let score: AttemptScore
    let passingScore: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Score \(Int(score.score))%")
                .font(.title2.weight(.bold))
            Text(score.score >= Double(passingScore) ? "Passed" : "Keep practicing")
                .foregroundStyle(score.score >= Double(passingScore) ? .green : Theme.highlight)
            if let correct = score.correctCount, let total = score.total {
                Text("\(correct) of \(total) correct")
                    .font(.caption)
                    .foregroundStyle(Theme.mutedInk)
            }
        }
        .appCard()
    }
}

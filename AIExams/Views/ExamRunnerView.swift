import SwiftUI

/// Full-screen attempt: the runner while unfinished, then the score report.
/// Retake swaps in a fresh attempt without leaving the screen.
struct AttemptFlowView: View {
    @EnvironmentObject private var launcher: ExamLauncher
    @Environment(\.dismiss) private var dismiss
    @State var attemptId: String
    @State var showResults: Bool

    var body: some View {
        NavigationStack {
            Group {
                if showResults {
                    ResultsView(attemptId: attemptId, onRetake: { newId in
                        attemptId = newId
                        showResults = false
                    })
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            Button("Done") { dismiss() }
                        }
                    }
                } else {
                    ExamRunnerView(attemptId: attemptId, onSubmitted: { showResults = true }, onExit: { dismiss() })
                        .id(attemptId)
                }
            }
        }
        .interactiveDismissDisabled()
    }
}

struct ExamRunnerView: View {
    @EnvironmentObject private var session: SessionStore
    let attemptId: String
    let onSubmitted: () -> Void
    let onExit: () -> Void

    private enum Screen { case question, review }

    @State private var payload: AttemptResponse?
    @State private var loadError: String?
    @State private var answers: [String: SavedResponse] = [:]
    @State private var index = 0
    @State private var screen: Screen = .question
    @State private var walk: [Int]?          // Review All / Flagged / Incomplete visit only these
    @State private var reachedEnd = false
    @State private var reveals: [String: AnswerResponse] = [:]  // Practice: shown after Check
    @State private var checking = false
    @State private var remaining = 0
    @State private var timeUp = false
    @State private var submitting = false
    @State private var actionError: String?
    @State private var confirmSubmit = false
    @State private var confirmExit = false
    @State private var showSheet = false
    @State private var saveTasks: [String: Task<Void, Never>] = [:]

    private var isExam: Bool { payload?.attempt.mode == .exam }
    private var questions: [Question] { payload?.questions ?? [] }
    private func isAnswered(_ q: Question) -> Bool { !(answers[q.id]?.answer.isEmpty ?? true) }
    private func isFlagged(_ q: Question) -> Bool { answers[q.id]?.flagged ?? false }
    private var answeredCount: Int { questions.filter(isAnswered).count }
    private var flaggedCount: Int { questions.filter(isFlagged).count }
    private var incompleteCount: Int { questions.count - answeredCount }

    var body: some View {
        Group {
            if let payload, !payload.questions.isEmpty {
                VStack(spacing: 0) {
                    statusBar(payload)
                    if screen == .review {
                        reviewScreen
                    } else {
                        questionScreen(payload.questions[index])
                    }
                }
                .background(Theme.background)
            } else if let loadError {
                ContentUnavailableView {
                    Label("Couldn't open this exam", systemImage: "doc.questionmark")
                } description: {
                    Text(loadError)
                } actions: {
                    Button("Try again") { Task { await load() } }.buttonStyle(.borderedProminent)
                    Button("Close") { onExit() }
                }
            } else {
                ProgressView("Opening exam…")
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { toolbar }
        // Navy test-centre title bar with light text, joined to the status bar below.
        .toolbarBackground(Theme.navy, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task { await load() }
        .task(id: payload?.attempt.id) { await runClock() }
        .overlay { if timeUp { timeUpOverlay } }
        .confirmationDialog(isExam ? "Submit your exam?" : "Finish this practice?", isPresented: $confirmSubmit, titleVisibility: .visible) {
            Button(isExam ? "Submit Exam" : "Finish and see results") { Task { await submit() } }
            Button("Keep going", role: .cancel) {}
        } message: {
            Text("\(answeredCount) answered · \(incompleteCount) unanswered · \(flaggedCount) flagged")
        }
        .confirmationDialog("Save and exit?", isPresented: $confirmExit, titleVisibility: .visible) {
            Button("Save & exit") { Task { await flushSaves(); onExit() } }
            Button("Keep going", role: .cancel) {}
        } message: {
            Text(isExam ? "Your answers are saved. The exam timer keeps running while you're away." : "Your answers are saved. Resume from My Exams any time.")
        }
        .alert("Something went wrong", isPresented: Binding(get: { actionError != nil }, set: { if !$0 { actionError = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(actionError ?? "")
        }
        .sheet(isPresented: $showSheet) { answerSheet }
    }

    // MARK: Chrome

    @ToolbarContentBuilder
    private var toolbar: some ToolbarContent {
        ToolbarItem(placement: .topBarLeading) {
            Button("Exit") { confirmExit = true }
                .disabled(submitting)
        }
        ToolbarItem(placement: .principal) {
            VStack(spacing: 0) {
                Text(payload?.exam.code.strippingVariant ?? "").font(.subheadline.weight(.bold).monospaced())
                Text(isExam ? "Exam mode" : "Practice mode").font(.caption2).foregroundStyle(.white.opacity(0.75))
            }
            .foregroundStyle(.white)
        }
        ToolbarItem(placement: .topBarTrailing) {
            if payload != nil {
                if isExam {
                    if reachedEnd && screen == .question {
                        Button("Review") { openReview() }
                    }
                } else {
                    Button("Finish") { confirmSubmit = true }
                        .disabled(submitting)
                }
            }
        }
    }

    private func statusBar(_ payload: AttemptResponse) -> some View {
        HStack(spacing: 12) {
            if isExam {
                Label(durationText(remaining), systemImage: "timer")
                    .font(.headline.monospacedDigit())
                    .foregroundStyle(remaining <= 300 ? Theme.highlight : .white)
                    .accessibilityLabel("Time remaining \(durationText(remaining))")
            }
            Spacer()
            Text("\(answeredCount)/\(payload.questions.count) answered")
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(.white.opacity(0.85))
            if !isExam {
                Button { showSheet = true } label: {
                    Image(systemName: "square.grid.3x3.fill")
                        .frame(width: 44, height: 36)
                }
                .foregroundStyle(.white)
                .accessibilityLabel("All questions")
            }
        }
        .padding(.horizontal, 16)
        .frame(minHeight: 44)
        .background(Theme.navy)
    }

    // MARK: Question

    private func questionScreen(_ q: Question) -> some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    HStack(alignment: .center) {
                        Text("Question \(index + 1) of \(questions.count)")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Theme.mutedInk)
                        Spacer()
                        Button { toggleFlag(q) } label: {
                            Label(isFlagged(q) ? "Flagged" : "Flag for review", systemImage: isFlagged(q) ? "flag.fill" : "flag")
                                .font(.subheadline.weight(.semibold))
                                .padding(.horizontal, 10)
                                .frame(minHeight: 36)
                                .background((isFlagged(q) ? Theme.highlight : Theme.mutedInk).opacity(0.12), in: Capsule())
                        }
                        .foregroundStyle(isFlagged(q) ? Theme.highlight : Theme.mutedInk)
                    }

                    Text(q.stem)
                        .font(.body.weight(.medium))
                        .fixedSize(horizontal: false, vertical: true)
                        .textSelection(.enabled)

                    if q.type == .multi {
                        hint("Select \(numberWord(q.requiredCount)) answers.")
                    } else if q.type == .ordering {
                        hint("Tap the steps in the correct order. Tap a step again to remove it.")
                    }

                    if q.type == .ordering {
                        OrderingInput(steps: q.displayOptions, sequence: answers[q.id]?.answer ?? [], locked: reveals[q.id] != nil) { seq in
                            setAnswer(q, seq)
                        }
                    } else {
                        VStack(spacing: 10) {
                            ForEach(q.displayOptions) { option in optionRow(option, q) }
                        }
                    }

                    if let reveal = reveals[q.id] { revealBox(reveal, q) }
                }
                .padding(16)
                .readableWidth()
            }

            navBar(q)
        }
    }

    private func optionRow(_ option: QuestionOption, _ q: Question) -> some View {
        let selected = answers[q.id]?.answer.contains(option.id) ?? false
        let reveal = reveals[q.id]
        let isCorrect = reveal?.correct?.contains(option.id) ?? false
        let tint: Color = reveal == nil ? Theme.primary : isCorrect ? Theme.pass : selected ? Theme.fail : Theme.mutedInk
        let icon: String = {
            if reveal != nil { return isCorrect ? "checkmark.circle.fill" : selected ? "xmark.circle.fill" : (q.type == .multi ? "square" : "circle") }
            if q.type == .multi { return selected ? "checkmark.square.fill" : "square" }
            return selected ? "largecircle.fill.circle" : "circle"
        }()
        return Button {
            select(option, q)
        } label: {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: icon).font(.title3).foregroundStyle(selected || (reveal != nil && isCorrect) ? tint : Theme.mutedInk)
                Text(option.text)
                    .foregroundStyle(Theme.ink)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(14)
            .frame(minHeight: 52)
            .background(
                (selected || (reveal != nil && isCorrect)) ? tint.opacity(0.10) : Theme.surface,
                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
            )
            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(selected || (reveal != nil && isCorrect) ? tint : Theme.line.opacity(0.6), lineWidth: selected ? 2 : 1))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(reveal != nil)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private func revealBox(_ reveal: AnswerResponse, _ q: Question) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Label(reveal.isCorrect == true ? "Correct" : "Not quite", systemImage: reveal.isCorrect == true ? "checkmark.circle.fill" : "xmark.circle.fill")
                .font(.headline)
                .foregroundStyle(reveal.isCorrect == true ? Theme.pass : Theme.fail)
            if q.type == .ordering, let correct = reveal.correct {
                Text("Correct order: \(sequenceText(correct, q))").font(.subheadline.weight(.semibold))
            }
            if !q.domain.isEmpty { DomainChip(domain: q.domain) }
            if let explanation = reveal.explanation, !explanation.isEmpty {
                Text(explanation).font(.subheadline).fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .appCard()
    }

    private func navBar(_ q: Question) -> some View {
        let last = isLastInWalk
        return VStack(spacing: 10) {
            if !isExam && reveals[q.id] == nil {
                Button {
                    Task { await check(q) }
                } label: {
                    HStack { if checking { ProgressView().tint(.white) }; Text("Check answer") }
                }
                .buttonStyle(PrimaryButtonStyle(tint: Theme.secondary))
                .disabled(!isAnswered(q) || checking)
            }
            HStack(spacing: 10) {
                Button { previous() } label: { Label("Previous", systemImage: "chevron.left") }
                    .buttonStyle(SecondaryButtonStyle())
                    .disabled(isFirstInWalk)
                Button { next() } label: {
                    if last {
                        Text(isExam ? "Review Screen" : "Finish")
                    } else {
                        Label("Next", systemImage: "chevron.right").labelStyle(TrailingIconLabelStyle())
                    }
                }
                .buttonStyle(PrimaryButtonStyle())
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .readableWidth()
        .background(.bar)
    }

    // MARK: Review Screen (Exam mode)

    private var reviewScreen: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Review Screen").font(.title2.weight(.bold))
                Text("Summary of reviews and completed").font(.subheadline).foregroundStyle(Theme.mutedInk)
                HStack(spacing: 10) {
                    countTile("Completed", answeredCount, Theme.pass)
                    countTile("Flagged for review", flaggedCount, Theme.highlight)
                    if incompleteCount > 0 { countTile("Incomplete", incompleteCount, Theme.fail) }
                }
                VStack(spacing: 10) {
                    if flaggedCount > 0 {
                        Button("Review Flagged (\(flaggedCount))") { startWalk(questions.indices.filter { isFlagged(questions[$0]) }) }
                            .buttonStyle(SecondaryButtonStyle(tint: Theme.highlight))
                    }
                    if incompleteCount > 0 {
                        Button("Review Incomplete (\(incompleteCount))") { startWalk(questions.indices.filter { !isAnswered(questions[$0]) }) }
                            .buttonStyle(SecondaryButtonStyle(tint: Theme.fail))
                    }
                    Button("Review All") { startWalk(Array(questions.indices)) }
                        .buttonStyle(SecondaryButtonStyle())
                    Button { confirmSubmit = true } label: {
                        HStack { if submitting { ProgressView().tint(.white) }; Text("Submit Exam") }
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(incompleteCount > 0 || submitting)
                    if incompleteCount > 0 {
                        Text("Answer every question to submit. Time still counts down.")
                            .font(.footnote).foregroundStyle(Theme.mutedInk)
                    }
                }

                VStack(spacing: 0) {
                    ForEach(questions.indices, id: \.self) { i in
                        Button {
                            walk = nil
                            index = i
                            screen = .question
                        } label: {
                            HStack {
                                Text("Question \(i + 1)").font(.body.monospacedDigit())
                                Spacer()
                                if isFlagged(questions[i]) { Image(systemName: "flag.fill").foregroundStyle(Theme.highlight) }
                                Text(isAnswered(questions[i]) ? "Completed" : "Incomplete")
                                    .font(.subheadline)
                                    .foregroundStyle(isAnswered(questions[i]) ? Theme.pass : Theme.fail)
                                Image(systemName: "chevron.right").font(.caption).foregroundStyle(Theme.mutedInk)
                            }
                            .padding(.horizontal, 16)
                            .frame(minHeight: 48)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        if i < questions.count - 1 { Divider().padding(.leading, 16) }
                    }
                }
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .padding(16)
            .readableWidth()
        }
    }

    private func countTile(_ label: String, _ value: Int, _ tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\(value)").font(.title.weight(.bold).monospacedDigit()).foregroundStyle(tint)
            Text(label).font(.caption).foregroundStyle(Theme.mutedInk).fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .appCard(padding: 12)
    }

    // MARK: Practice answer sheet

    private var answerSheet: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 56), spacing: 10)], spacing: 10) {
                    ForEach(questions.indices, id: \.self) { i in
                        let q = questions[i]
                        Button {
                            index = i
                            screen = .question
                            walk = nil
                            showSheet = false
                        } label: {
                            Text("\(i + 1)")
                                .font(.headline.monospacedDigit())
                                .frame(width: 56, height: 56)
                                .background(sheetColor(q).opacity(0.15), in: RoundedRectangle(cornerRadius: 10))
                                .overlay(RoundedRectangle(cornerRadius: 10).stroke(i == index ? Theme.primary : .clear, lineWidth: 2))
                                .overlay(alignment: .topTrailing) {
                                    if isFlagged(q) { Image(systemName: "flag.fill").font(.caption2).foregroundStyle(Theme.highlight).padding(4) }
                                }
                                .foregroundStyle(Theme.ink)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding()
            }
            .navigationTitle("Questions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { Button("Close") { showSheet = false } }
        }
        .presentationDetents([.medium, .large])
    }

    private func sheetColor(_ q: Question) -> Color {
        if let r = reveals[q.id] { return r.isCorrect == true ? Theme.pass : Theme.fail }
        return isAnswered(q) ? Theme.primary : Theme.mutedInk
    }

    private var timeUpOverlay: some View {
        ZStack {
            Color.black.opacity(0.55).ignoresSafeArea()
            VStack(spacing: 14) {
                Image(systemName: "alarm.fill").font(.system(size: 44)).foregroundStyle(Theme.highlight)
                Text("Time's up").font(.title.weight(.bold))
                Text("Your exam is being submitted.").foregroundStyle(Theme.mutedInk)
                ProgressView()
            }
            .padding(28)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 16))
            .padding(32)
        }
    }

    private func hint(_ text: String) -> some View {
        Text(text).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.primary)
    }

    // MARK: Navigation

    private var walkPosition: Int? { walk?.firstIndex(of: index) }
    private var isFirstInWalk: Bool { walk.map { walkPosition == 0 || $0.isEmpty } ?? (index == 0) }
    private var isLastInWalk: Bool {
        if let walk, let pos = walkPosition { return pos == walk.count - 1 }
        return index == questions.count - 1
    }

    private func next() {
        Task { await saveIfDirty(questions[index]) }
        if isLastInWalk {
            if isExam { openReview() } else { confirmSubmit = true }
            return
        }
        if let walk, let pos = walkPosition { index = walk[pos + 1] } else { index += 1 }
    }

    private func previous() {
        if let walk, let pos = walkPosition, pos > 0 { index = walk[pos - 1] }
        else if walk == nil && index > 0 { index -= 1 }
    }

    private func openReview() {
        reachedEnd = true
        walk = nil
        screen = .review
    }

    private func startWalk(_ indices: [Int]) {
        guard let first = indices.first else { return }
        walk = indices
        index = first
        screen = .question
    }

    // MARK: Answers

    private func select(_ option: QuestionOption, _ q: Question) {
        var current = answers[q.id]?.answer ?? []
        if q.type == .multi {
            if let i = current.firstIndex(of: option.id) { current.remove(at: i) }
            else if current.count < q.requiredCount { current.append(option.id) }
            else { current = Array(current.dropFirst()) + [option.id] }
        } else {
            current = [option.id]
        }
        setAnswer(q, current)
    }

    private func setAnswer(_ q: Question, _ answer: [String]) {
        var saved = answers[q.id] ?? SavedResponse(answer: [], flagged: false, timeSpent: nil)
        saved.answer = answer
        answers[q.id] = saved
        dirty.insert(q.id)
        // Exam mode saves every change straight away; Practice saves on Check.
        if isExam { scheduleSave(q) }
    }

    @State private var dirty = Set<String>()

    private func scheduleSave(_ q: Question) {
        saveTasks[q.id]?.cancel()
        saveTasks[q.id] = Task {
            try? await Task.sleep(for: .milliseconds(400))
            guard !Task.isCancelled else { return }
            await save(q)
        }
    }

    private func saveIfDirty(_ q: Question) async {
        if dirty.contains(q.id) && reveals[q.id] == nil { await save(q) }
    }

    private func save(_ q: Question) async {
        guard let saved = answers[q.id] else { return }
        do {
            _ = try await session.api.answer(attemptId: attemptId, questionId: q.id, answer: saved.answer, flagged: saved.flagged)
            if answers[q.id]?.answer == saved.answer { dirty.remove(q.id) }
        } catch {
            if case APIError.unauthorized = error { actionError = session.handle(error) }
        }
    }

    private func flushSaves() async {
        for task in saveTasks.values { task.cancel() }
        saveTasks = [:]
        for q in questions where dirty.contains(q.id) { await save(q) }
    }

    private func check(_ q: Question) async {
        guard let saved = answers[q.id] else { return }
        checking = true
        defer { checking = false }
        do {
            let reveal = try await session.api.answer(attemptId: attemptId, questionId: q.id, answer: saved.answer, flagged: saved.flagged)
            reveals[q.id] = reveal
            dirty.remove(q.id)
        } catch {
            actionError = session.handle(error)
        }
    }

    private func toggleFlag(_ q: Question) {
        var saved = answers[q.id] ?? SavedResponse(answer: [], flagged: false, timeSpent: nil)
        saved.flagged = !(saved.flagged ?? false)
        answers[q.id] = saved
        let flagged = saved.flagged ?? false
        Task { _ = try? await session.api.mark(attemptId: attemptId, questionId: q.id, flagged: flagged) }
    }

    // MARK: Lifecycle

    private func load() async {
        guard payload == nil else { return }
        loadError = nil
        do {
            let loaded = try await session.api.attempt(id: attemptId)
            if loaded.attempt.submittedAt != nil {
                onSubmitted()
                return
            }
            answers = loaded.attempt.responses
            remaining = loaded.attempt.remainingSec ?? 0
            // Resume where the candidate left off: first unanswered question.
            index = loaded.questions.firstIndex { (answers[$0.id]?.answer.isEmpty ?? true) } ?? 0
            reachedEnd = loaded.attempt.mode == .exam && loaded.questions.allSatisfy { !(answers[$0.id]?.answer.isEmpty ?? true) }
            payload = loaded
            if loaded.attempt.mode == .exam && remaining <= 0 { await expire() }
            #if DEBUG
            await screenshotSetup(loaded)
            #endif
        } catch {
            loadError = session.handle(error)
        }
    }

    private func runClock() async {
        guard isExam, !timeUp else { return }
        while !Task.isCancelled && remaining > 0 {
            try? await Task.sleep(for: .seconds(1))
            guard !Task.isCancelled else { return }
            remaining -= 1
        }
        if !Task.isCancelled && remaining <= 0 && payload != nil { await expire() }
    }

    private func expire() async {
        guard !timeUp else { return }
        timeUp = true
        await submit()
    }

    private func submit() async {
        guard !submitting else { return }
        submitting = true
        defer { submitting = false }
        await flushSaves()
        do {
            _ = try await session.api.submit(attemptId: attemptId)
            onSubmitted()
        } catch {
            timeUp = false
            actionError = session.handle(error)
        }
    }

    #if DEBUG
    /// Puts the runner in a representative state for App Store screenshots.
    private func screenshotSetup(_ loaded: AttemptResponse) async {
        switch ScreenshotAutomation.route {
        case "play-exam", "play-practice":
            await autoplay(loaded)
        case "review":
            openReview()
        case "practice", "exam":
            let q = loaded.questions[index]
            if let option = q.displayOptions.dropFirst().first ?? q.displayOptions.first {
                select(option, q)
                if ScreenshotAutomation.route == "practice" { await check(q) }
            }
        default:
            break
        }
    }
    #endif

    #if DEBUG
    /// Answers every question (a varied pick per question), flags two, then
    /// walks to the end like a candidate: Exam mode opens the Review Screen
    /// and submits; Practice mode checks each answer and finishes.
    private func autoplay(_ loaded: AttemptResponse) async {
        for (i, q) in loaded.questions.enumerated() {
            index = i
            let opts = q.displayOptions
            let pick = (i * 7 + 3) % max(opts.count, 1)
            switch q.type {
            case .ordering:
                setAnswer(q, (i % 2 == 0 ? opts : opts.reversed()).map(\.id))
            case .multi:
                for k in 0..<q.requiredCount { select(opts[(pick + k) % opts.count], q) }
            default:
                select(opts[pick], q)
            }
            if i == 2 || i == 5 { toggleFlag(q) }
            if isExam { await save(q) } else { await check(q) }
            if !isExam && ScreenshotAutomation.smart && i % 6 != 0,
               let key = reveals[q.id]?.correct, reveals[q.id]?.isCorrect != true {
                answers[q.id]?.answer = key
                if let r = try? await session.api.answer(attemptId: attemptId, questionId: q.id, answer: key, flagged: answers[q.id]?.flagged) {
                    reveals[q.id] = AnswerResponse(saved: r.saved, isCorrect: true, correct: r.correct, explanation: r.explanation)
                }
            }
            try? await Task.sleep(for: .milliseconds(150))
        }
        index = loaded.questions.count - 1
        next()  // last question: Exam → Review Screen, Practice → finish dialog
        try? await Task.sleep(for: .seconds(4))
        confirmSubmit = false
        await submit()
    }
    #endif

    private func sequenceText(_ ids: [String], _ q: Question) -> String {
        let steps = q.displayOptions
        return ids.compactMap { id in steps.firstIndex { $0.id == id }.map { "\($0 + 1)" } }.joined(separator: " → ")
    }
}

/// Tap steps in order to build the answer sequence (ids in order).
struct OrderingInput: View {
    let steps: [QuestionOption]
    let sequence: [String]
    let locked: Bool
    let onChange: ([String]) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(Array(steps.enumerated()), id: \.element.id) { i, step in
                let position = sequence.firstIndex(of: step.id)
                Button {
                    var next = sequence
                    if let position { next.remove(at: position) } else { next.append(step.id) }
                    onChange(next)
                } label: {
                    HStack(alignment: .top, spacing: 12) {
                        ZStack {
                            Circle().fill(position != nil ? Theme.primary : Theme.line.opacity(0.4)).frame(width: 30, height: 30)
                            Text(position.map { "\($0 + 1)" } ?? "")
                                .font(.subheadline.weight(.bold)).foregroundStyle(.white)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Step \(i + 1)").font(.caption.weight(.semibold)).foregroundStyle(Theme.mutedInk)
                            Text(step.text).foregroundStyle(Theme.ink).fixedSize(horizontal: false, vertical: true)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(14)
                    .frame(minHeight: 52)
                    .background(position != nil ? Theme.primary.opacity(0.08) : Theme.surface, in: RoundedRectangle(cornerRadius: 12))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(position != nil ? Theme.primary : Theme.line.opacity(0.6)))
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .disabled(locked)
            }
            if !sequence.isEmpty {
                HStack {
                    Text("Your order: " + sequence.compactMap { id in steps.firstIndex { $0.id == id }.map { "\($0 + 1)" } }.joined(separator: " → "))
                        .font(.subheadline.monospacedDigit().weight(.semibold))
                    Spacer()
                    if !locked { Button("Clear") { onChange([]) }.frame(minHeight: 44) }
                }
            }
        }
    }
}

struct DomainChip: View {
    let domain: String
    var body: some View {
        HStack(spacing: 6) {
            Text("Exam domain").font(.caption2.weight(.bold)).foregroundStyle(Theme.mutedInk)
            Text(domain).font(.caption.weight(.semibold)).foregroundStyle(Theme.secondary)
        }
        .padding(.horizontal, 10).padding(.vertical, 6)
        .background(Theme.secondary.opacity(0.10), in: Capsule())
    }
}

struct TrailingIconLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 6) { configuration.title; configuration.icon }
    }
}

func numberWord(_ n: Int) -> String {
    let words = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX"]
    return n < words.count ? words[n] : "\(n)"
}

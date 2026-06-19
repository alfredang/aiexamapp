import SwiftUI

struct LibraryView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var library: LibraryResponse?
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if session.token == nil {
                    AuthRequiredView(message: "Sign in to see purchased practice exams and continue your progress.")
                } else if isLoading && library == nil {
                    ProgressView()
                } else if let library {
                    List {
                        if library.bundles.isEmpty && library.standalone.isEmpty {
                            ContentUnavailableView("No purchased exams", systemImage: "books.vertical", description: Text("Your purchased practice exams will appear here after web checkout."))
                        }
                        ForEach(library.bundles) { bundle in
                            Section(bundle.bundleTitle) {
                                ForEach(bundle.items) { item in
                                    LibraryExamRow(item: item)
                                }
                            }
                        }
                        if !library.standalone.isEmpty {
                            Section("Standalone") {
                                ForEach(library.standalone) { item in
                                    LibraryExamRow(item: item)
                                }
                            }
                        }
                    }
                    .refreshable { await load() }
                } else {
                    ContentUnavailableView("Could not load exams", systemImage: "wifi.exclamationmark", description: Text(errorMessage ?? "Try again."))
                }
            }
            .navigationTitle("My Exams")
            .toolbar {
                Button {
                    Task { await load() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
            }
            .task {
                if session.token != nil {
                    await load()
                }
            }
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            library = try await session.api.library()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct AuthRequiredView: View {
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "lock.circle")
                .font(.system(size: 48))
                .foregroundStyle(Theme.primary)
            Text("Sign in required")
                .font(.title2.weight(.semibold))
            Text(message)
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.mutedInk)
            Text("Use the Account tab to sign in or create a free account.")
                .font(.footnote)
                .foregroundStyle(Theme.mutedInk)
        }
        .padding()
    }
}

private struct LibraryExamRow: View {
    let item: LibraryExam
    @State private var selectedMode: ExamMode = .practice

    var body: some View {
        NavigationLink {
            StartExamView(examId: item.examId, title: item.examTitle, code: item.examCode, mode: selectedMode, teaser: false)
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(item.examCode)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Theme.primary)
                    Text(item.vendorName)
                        .font(.caption)
                        .foregroundStyle(Theme.mutedInk)
                }
                Text(item.examTitle)
                    .font(.headline)
                HStack {
                    Picker("Mode", selection: $selectedMode) {
                        ForEach(ExamMode.allCases) { mode in
                            Text(mode.title).tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)
                    Text("\(item.questionCount) questions")
                        .font(.caption)
                        .foregroundStyle(Theme.mutedInk)
                }
            }
            .padding(.vertical, 6)
        }
    }
}

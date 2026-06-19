import SwiftUI

struct CatalogView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var catalog: CatalogResponse?
    @State private var searchText = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if let catalog {
                    List {
                        Section {
                            Text("Browse all practice exam bundles. Buying and payment are not available in this app.")
                                .font(.footnote)
                                .foregroundStyle(Theme.mutedInk)
                        }
                        ForEach(catalog.bundles) { bundle in
                            NavigationLink {
                                CatalogDetailView(bundle: bundle)
                            } label: {
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        if let vendor = bundle.vendor {
                                            Text(vendor.name)
                                                .font(.caption.weight(.semibold))
                                                .foregroundStyle(Theme.primary)
                                        }
                                        Text(bundle.code)
                                            .font(.caption)
                                            .foregroundStyle(Theme.mutedInk)
                                    }
                                    Text(bundle.title)
                                        .font(.headline)
                                    Text("\(bundle.totalQuestions) questions across \(bundle.practiceExamCount) practice exams")
                                        .font(.caption)
                                        .foregroundStyle(Theme.mutedInk)
                                }
                                .padding(.vertical, 6)
                            }
                        }
                    }
                    .refreshable { await load() }
                } else if isLoading {
                    ProgressView()
                } else {
                    ContentUnavailableView("Catalog unavailable", systemImage: "wifi.exclamationmark", description: Text(errorMessage ?? "Try again."))
                }
            }
            .navigationTitle("Catalog")
            .searchable(text: $searchText, prompt: "Search certifications")
            .onSubmit(of: .search) { Task { await load() } }
            .toolbar {
                Button {
                    Task { await load() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
            }
            .task { await load() }
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            catalog = try await session.api.catalog(query: searchText)
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct CatalogDetailView: View {
    let bundle: CatalogBundle

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 10) {
                    Text(bundle.title)
                        .font(.title2.weight(.bold))
                    Text(bundle.description)
                        .foregroundStyle(Theme.mutedInk)
                    HStack {
                        Label("\(bundle.totalQuestions)", systemImage: "questionmark.circle")
                        Label("\(bundle.practiceExamCount)", systemImage: "list.number")
                    }
                    .font(.caption)
                    .foregroundStyle(Theme.mutedInk)
                }
            }

            Section("Practice exams") {
                ForEach(bundle.exams) { exam in
                    NavigationLink {
                        StartExamView(examId: exam.id, title: exam.title, code: exam.code, mode: .practice, teaser: true)
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Free teaser: \(exam.code)")
                                .font(.headline)
                            Text("\(exam.durationMinutes) min exam mode · pass \(exam.passingScore)%")
                                .font(.caption)
                                .foregroundStyle(Theme.mutedInk)
                        }
                    }
                }
            }

            Section {
                Text("Full practice access requires an existing web purchase. No checkout or payment flow is included in this app.")
                    .font(.footnote)
                    .foregroundStyle(Theme.mutedInk)
            }
        }
        .navigationTitle(bundle.code)
        .navigationBarTitleDisplayMode(.inline)
    }
}

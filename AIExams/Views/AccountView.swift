import SwiftUI

struct AccountView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var showingDeleteConfirmation = false
    @State private var isDeleting = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if session.token == nil {
                    AuthView()
                        .navigationTitle("Account")
                } else {
                    List {
                        Section {
                            Label(session.user?.email ?? "Signed in", systemImage: "person.crop.circle")
                            if let name = session.user?.name, !name.isEmpty {
                                Label(name, systemImage: "textformat")
                            }
                        }

                        Section {
                            Link(destination: URL(string: "https://exams.tertiaryinfotech.com/")!) {
                                Label("Open Tertiary Exams Website", systemImage: "safari")
                            }
                            Text("Purchases, payments, invoices, and vouchers stay on the website. This app is for mobile practice.")
                                .font(.footnote)
                                .foregroundStyle(Theme.mutedInk)
                        }

                        Section {
                            if let errorMessage {
                                Text(errorMessage)
                                    .font(.footnote)
                                    .foregroundStyle(.red)
                            }
                            Button(role: .destructive) {
                                showingDeleteConfirmation = true
                            } label: {
                                Label(isDeleting ? "Deleting..." : "Delete Account", systemImage: "trash")
                            }
                            .disabled(isDeleting)

                            Button(role: .destructive) {
                                session.signOut()
                            } label: {
                                Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                            }
                        }
                    }
                    .navigationTitle("Account")
                }
            }
            .confirmationDialog(
                "Delete your account?",
                isPresented: $showingDeleteConfirmation,
                titleVisibility: .visible
            ) {
                Button("Delete Account", role: .destructive) {
                    Task { await deleteAccount() }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Your account will be anonymized and disabled. Purchase records may be retained for legal and accounting purposes.")
            }
        }
    }

    private func deleteAccount() async {
        isDeleting = true
        defer { isDeleting = false }
        do {
            _ = try await session.api.deleteAccount()
            session.signOut()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

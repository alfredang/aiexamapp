import SwiftUI

struct AccountView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var showingDeleteConfirmation = false
    @State private var isDeleting = false
    @State private var errorMessage: String?

    private var version: String {
        let v = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? ""
        let b = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? ""
        return "\(v) (\(b))"
    }

    var body: some View {
        NavigationStack {
            List {
                Section("Signed in as") {
                    if let name = session.user?.name, !name.isEmpty {
                        Label(name, systemImage: "person.crop.circle")
                    }
                    Label(session.user?.email ?? "", systemImage: "envelope")
                }

                Section {
                    Text("Your practice exams and scores are shared with your Tertiary Exams account, so you can switch between this app and a computer at any time.")
                        .font(.footnote)
                        .foregroundStyle(Theme.mutedInk)
                }

                Section {
                    Link(destination: URL(string: "https://www.tertiaryinfotech.com/privacy")!) {
                        Label("Privacy policy", systemImage: "hand.raised")
                    }
                    LabeledContent("Version", value: version)
                }

                Section {
                    Button {
                        session.signOut()
                    } label: {
                        Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                    Button(role: .destructive) {
                        showingDeleteConfirmation = true
                    } label: {
                        Label(isDeleting ? "Deleting…" : "Delete account", systemImage: "trash")
                    }
                    .disabled(isDeleting)
                    if let errorMessage {
                        Text(errorMessage).font(.footnote).foregroundStyle(Theme.fail)
                    }
                }
            }
            .navigationTitle("Account")
            .confirmationDialog("Delete your account?", isPresented: $showingDeleteConfirmation, titleVisibility: .visible) {
                Button("Delete account", role: .destructive) { Task { await deleteAccount() } }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Your account will be anonymized and disabled, and you will lose access to your practice exams. Purchase records may be retained for legal and accounting purposes.")
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
            errorMessage = session.handle(error)
        }
    }
}

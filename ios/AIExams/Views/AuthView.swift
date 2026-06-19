import SwiftUI

struct AuthView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var isRegistering = false
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isBusy = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if isRegistering {
                        TextField("Name", text: $name)
                            .textContentType(.name)
                    }
                    TextField("Email", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                    SecureField("Password", text: $password)
                        .textContentType(isRegistering ? .newPassword : .password)
                }

                if let error = session.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }

                Section {
                    Button {
                        Task { await submit() }
                    } label: {
                        HStack {
                            Spacer()
                            if isBusy { ProgressView() }
                            Text(isRegistering ? "Create Account" : "Sign In")
                            Spacer()
                        }
                    }
                    .disabled(isBusy || email.isEmpty || password.count < 8)

                    Button(isRegistering ? "I already have an account" : "Create a free account") {
                        isRegistering.toggle()
                        session.errorMessage = nil
                    }
                    .frame(maxWidth: .infinity)
                }

                Section {
                    Text("Use the app to practice exams you already own and try available free teasers. Purchases and payments are handled on the website.")
                        .font(.footnote)
                        .foregroundStyle(Theme.mutedInk)
                }
            }
            .navigationTitle("AI Exams")
        }
    }

    private func submit() async {
        isBusy = true
        if isRegistering {
            await session.register(name: name, email: email, password: password)
        } else {
            await session.login(email: email, password: password)
        }
        isBusy = false
    }
}

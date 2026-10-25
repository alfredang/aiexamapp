import SwiftUI

/// Sign in with a 6-digit email code (default), with a password, or create an
/// account with full name + email. Every path ends with a mobile token.
struct AuthView: View {
    @EnvironmentObject private var session: SessionStore

    private enum Flow: String, CaseIterable, Identifiable {
        case signIn = "Sign in"
        case register = "Create account"
        var id: String { rawValue }
    }

    private enum Field: Hashable { case name, email, password, code }

    @State private var flow: Flow = .signIn
    @State private var usePassword = false
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var code = ""
    @State private var codeSent = false
    @State private var isBusy = false
    @State private var errorMessage: String?
    @State private var infoMessage: String?
    @FocusState private var focus: Field?

    private var trimmedEmail: String { email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
    private var emailLooksValid: Bool { trimmedEmail.range(of: #"^[^\s@]+@[^\s@]+\.[^\s@]+$"#, options: .regularExpression) != nil }
    private var purpose: CodePurpose { flow == .register ? .register : .login }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                header

                Picker("", selection: $flow) {
                    ForEach(Flow.allCases) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .disabled(codeSent || isBusy)
                .onChange(of: flow) { reset() }

                VStack(alignment: .leading, spacing: 14) {
                    if codeSent {
                        codeStep
                    } else if flow == .signIn && usePassword {
                        passwordStep
                    } else {
                        emailStep
                    }

                    if let errorMessage {
                        Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                            .font(.subheadline)
                            .foregroundStyle(Theme.fail)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .appCard(padding: 20)

                Text("Use the same account as the Tertiary Exams website. Your practice exams appear here automatically.")
                    .font(.footnote)
                    .foregroundStyle(Theme.mutedInk)
                    .multilineTextAlignment(.center)
            }
            .padding(20)
            .frame(maxWidth: 520)
            .frame(maxWidth: .infinity)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Theme.background.ignoresSafeArea())
    }

    private var header: some View {
        VStack(spacing: 10) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 52))
                .foregroundStyle(Theme.primary)
                .accessibilityHidden(true)
            Text("Certificate Practice Exams")
                .font(.title2.weight(.bold))
                .multilineTextAlignment(.center)
            Text("Take your practice exams anywhere, in Exam mode or Practice mode.")
                .font(.subheadline)
                .foregroundStyle(Theme.mutedInk)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 24)
    }

    // MARK: Steps

    private var emailStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            if flow == .register {
                labeled("Full name") {
                    TextField("Full name", text: $name, prompt: Text(verbatim: "e.g. Tan Wei Ming"))
                        .textContentType(.name)
                        .textInputAutocapitalization(.words)
                        .submitLabel(.next)
                        .focused($focus, equals: .name)
                        .onSubmit { focus = .email }
                }
            }
            emailField
            Button {
                Task { await sendCode() }
            } label: {
                busyLabel(flow == .register ? "Email me a code" : "Email me a sign-in code")
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(isBusy || !emailLooksValid || (flow == .register && !FullName.isValid(name)))

            if flow == .register && !name.isEmpty && !FullName.isValid(name) {
                Text("Enter your first and last name as on your ID.")
                    .font(.footnote)
                    .foregroundStyle(Theme.mutedInk)
            }
            if flow == .signIn {
                Button("Sign in with a password instead") {
                    usePassword = true
                    errorMessage = nil
                }
                .frame(maxWidth: .infinity, minHeight: 44)
            }
        }
    }

    private var passwordStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            emailField
            labeled("Password") {
                SecureField("Password", text: $password)
                    .textContentType(.password)
                    .submitLabel(.go)
                    .focused($focus, equals: .password)
                    .onSubmit { Task { await passwordLogin() } }
            }
            Button {
                Task { await passwordLogin() }
            } label: {
                busyLabel("Sign in")
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(isBusy || !emailLooksValid || password.isEmpty)

            Button("Email me a code instead") {
                usePassword = false
                errorMessage = nil
            }
            .frame(maxWidth: .infinity, minHeight: 44)
        }
    }

    private var codeStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(infoMessage ?? "We sent a 6-digit code to \(trimmedEmail).")
                .font(.subheadline)
                .foregroundStyle(Theme.mutedInk)
                .fixedSize(horizontal: false, vertical: true)
            labeled("6-digit code") {
                TextField("Code", text: $code, prompt: Text(verbatim: "123456"))
                    .keyboardType(.numberPad)
                    .textContentType(.oneTimeCode)
                    .font(.title2.monospacedDigit())
                    .multilineTextAlignment(.center)
                    .focused($focus, equals: .code)
                    .onChange(of: code) { _, new in
                        let digits = String(new.filter(\.isNumber).prefix(6))
                        if digits != new { code = digits }
                        if digits.count == 6 && !isBusy { Task { await verify() } }
                    }
            }
            Button {
                Task { await verify() }
            } label: {
                busyLabel(flow == .register ? "Create account" : "Sign in")
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(isBusy || code.count != 6)

            HStack {
                Button("Use a different email") { reset() }
                Spacer()
                Button("Resend code") { Task { await sendCode() } }
                    .disabled(isBusy)
            }
            .font(.subheadline)
            .frame(minHeight: 44)
        }
        .onAppear { focus = .code }
    }

    private var emailField: some View {
        labeled("Email") {
            TextField("Email", text: $email, prompt: Text(verbatim: "you@example.com"))
                .keyboardType(.emailAddress)
                .textContentType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .submitLabel(.go)
                .focused($focus, equals: .email)
                .onSubmit {
                    if usePassword && flow == .signIn { focus = .password } else { Task { await sendCode() } }
                }
        }
    }

    private func labeled<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.subheadline.weight(.semibold))
            content()
                .padding(.horizontal, 12)
                .frame(minHeight: 48)
                .background(Theme.background, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
    }

    private func busyLabel(_ title: String) -> some View {
        HStack(spacing: 8) {
            if isBusy { ProgressView().tint(.white) }
            Text(title)
        }
    }

    // MARK: Actions

    private func reset() {
        codeSent = false
        code = ""
        password = ""
        errorMessage = nil
        infoMessage = nil
    }

    private func sendCode() async {
        guard emailLooksValid, !isBusy else { return }
        if flow == .register && !FullName.isValid(name) { return }
        isBusy = true
        defer { isBusy = false }
        do {
            _ = try await session.api.requestCode(email: trimmedEmail, purpose: purpose, name: flow == .register ? FullName.normalize(name) : nil)
            errorMessage = nil
            infoMessage = flow == .register
                ? "We sent a 6-digit code to \(trimmedEmail). Enter it to finish creating your account."
                : "If \(trimmedEmail) has an account, we sent it a 6-digit code."
            code = ""
            codeSent = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func verify() async {
        guard code.count == 6, !isBusy else { return }
        isBusy = true
        defer { isBusy = false }
        do {
            let response = try await session.api.verifyCode(email: trimmedEmail, code: code, purpose: purpose)
            session.signIn(response)
        } catch {
            errorMessage = error.localizedDescription
            code = ""
        }
    }

    private func passwordLogin() async {
        guard emailLooksValid, !password.isEmpty, !isBusy else { return }
        isBusy = true
        defer { isBusy = false }
        do {
            let response = try await session.api.login(email: trimmedEmail, password: password)
            session.signIn(response)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

/// Mirrors the website's isFullName(): two or more words, letters only, not a placeholder.
enum FullName {
    private static let placeholders: Set<String> = [
        "user", "test", "admin", "name", "student", "guest", "customer", "candidate",
        "na", "n/a", "none", "null", "unknown", "abc", "xyz", "asdf", "first", "last"
    ]

    static func normalize(_ s: String) -> String {
        s.split(whereSeparator: \.isWhitespace).joined(separator: " ")
    }

    static func isValid(_ s: String) -> Bool {
        let n = normalize(s)
        guard (3...120).contains(n.count) else { return false }
        guard n.range(of: #"^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]*$"#, options: .regularExpression) != nil else { return false }
        let words = n.split(separator: " ").filter { $0.contains(where: \.isLetter) }
        guard words.count >= 2 else { return false }
        return !words.allSatisfy { placeholders.contains($0.lowercased().trimmingCharacters(in: CharacterSet(charactersIn: "."))) }
    }
}

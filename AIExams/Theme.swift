import SwiftUI

enum Theme {
    static let primary = Color(red: 0.05, green: 0.36, blue: 0.92)
    static let secondary = Color(red: 0.00, green: 0.55, blue: 0.58)
    static let highlight = Color(red: 0.93, green: 0.64, blue: 0.13)
    static let navy = Color(red: 0.06, green: 0.11, blue: 0.24)
    static let pass = Color(red: 0.05, green: 0.55, blue: 0.30)
    static let fail = Color(red: 0.80, green: 0.15, blue: 0.15)
    static let background = Color(.systemGroupedBackground)
    static let surface = Color(.secondarySystemGroupedBackground)
    static let ink = Color(.label)
    static let mutedInk = Color(.secondaryLabel)
    static let line = Color(.separator)

    /// Readable content width on iPad.
    static let maxContentWidth: CGFloat = 720
}

extension View {
    func appCard(padding: CGFloat = 16) -> some View {
        self
            .padding(padding)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    /// Centers content at a readable width on iPad; full width on iPhone.
    func readableWidth() -> some View {
        frame(maxWidth: Theme.maxContentWidth).frame(maxWidth: .infinity)
    }
}

/// Full-width filled button, at least 50pt tall.
struct PrimaryButtonStyle: ButtonStyle {
    var tint: Color = Theme.primary
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .frame(maxWidth: .infinity, minHeight: 50)
            .padding(.horizontal, 12)
            .foregroundStyle(.white)
            .background(tint.opacity(isEnabled ? (configuration.isPressed ? 0.8 : 1) : 0.4),
                        in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

/// Full-width outlined button, at least 50pt tall.
struct SecondaryButtonStyle: ButtonStyle {
    var tint: Color = Theme.primary
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .frame(maxWidth: .infinity, minHeight: 50)
            .padding(.horizontal, 12)
            .foregroundStyle(tint.opacity(isEnabled ? 1 : 0.4))
            .background(tint.opacity(configuration.isPressed ? 0.15 : 0.08),
                        in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(tint.opacity(isEnabled ? 0.5 : 0.2)))
    }
}

func percentText(_ value: Int?) -> String { value.map { "\($0)%" } ?? "—" }

func durationText(_ seconds: Int?) -> String {
    guard let seconds else { return "—" }
    let h = seconds / 3600, m = (seconds % 3600) / 60, s = seconds % 60
    return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
}

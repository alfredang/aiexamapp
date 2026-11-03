import SwiftUI

/// Light palette matching the Tertiary Exams website (exams.tertiaryinfotech.com).
/// The app is locked to light appearance (`UIUserInterfaceStyle: Light`).
enum Theme {
    static let primary = Color(hex: 0x1D5BF0)
    static let secondary = Color(hex: 0x0E8A62)
    static let highlight = Color(hex: 0xE58A00)
    static let navy = Color(hex: 0x0A3479)
    static let pass = Color(hex: 0x15803D)
    static let fail = Color(hex: 0xDC2626)
    static let background = Color(hex: 0xF4F8FF)
    static let surface = Color.white
    static let accent = Color(hex: 0xCDDCF6)
    static let ink = Color(hex: 0x0E1A33)
    static let mutedInk = Color(hex: 0x52617D)
    static let line = Color(hex: 0xD6E0F0)

    /// Blue headline gradient used on the website hero ("Get certified.").
    static let headlineGradient = LinearGradient(
        colors: [Color(hex: 0x1D5BF0), Color(hex: 0x3B82F6), Color(hex: 0x0A3479)],
        startPoint: .leading, endPoint: .trailing
    )

    /// Readable content width on iPad.
    static let maxContentWidth: CGFloat = 720
}

extension Color {
    init(hex: UInt32) {
        self.init(red: Double((hex >> 16) & 0xFF) / 255,
                  green: Double((hex >> 8) & 0xFF) / 255,
                  blue: Double(hex & 0xFF) / 255)
    }
}

extension View {
    /// White card with a hairline border and soft shadow, like the website's cards.
    func appCard(padding: CGFloat = 16) -> some View {
        self
            .padding(padding)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(Theme.line))
            .shadow(color: Theme.navy.opacity(0.05), radius: 6, y: 2)
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
                        in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            .shadow(color: tint.opacity(isEnabled ? 0.18 : 0), radius: 4, y: 2)
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
            .background(configuration.isPressed ? tint.opacity(0.08) : Theme.surface,
                        in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous).stroke(isEnabled ? Theme.line : Theme.line.opacity(0.5)))
    }
}

func percentText(_ value: Int?) -> String { value.map { "\($0)%" } ?? "—" }

func durationText(_ seconds: Int?) -> String {
    guard let seconds else { return "—" }
    let h = seconds / 3600, m = (seconds % 3600) / 60, s = seconds % 60
    return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
}

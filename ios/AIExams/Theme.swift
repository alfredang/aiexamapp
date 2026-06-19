import SwiftUI

enum Theme {
    static let primary = Color(red: 0.05, green: 0.36, blue: 0.92)
    static let secondary = Color(red: 0.00, green: 0.55, blue: 0.58)
    static let highlight = Color(red: 0.93, green: 0.64, blue: 0.13)
    static let background = Color(.systemGroupedBackground)
    static let surface = Color(.secondarySystemGroupedBackground)
    static let ink = Color(.label)
    static let mutedInk = Color(.secondaryLabel)
}

extension View {
    func appCard(padding: CGFloat = 16) -> some View {
        self
            .padding(padding)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

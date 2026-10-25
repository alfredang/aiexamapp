import SwiftUI

struct RootView: View {
    @EnvironmentObject private var session: SessionStore

    var body: some View {
        if session.isSignedIn {
            MainTabView()
        } else {
            AuthView()
        }
    }
}

struct MainTabView: View {
    @State private var tab = MainTabView.startTab

    private static var startTab: Int {
        #if DEBUG
        ScreenshotAutomation.initialTab
        #else
        0
        #endif
    }

    var body: some View {
        TabView(selection: $tab) {
            LibraryView()
                .tabItem { Label("My Exams", systemImage: "checklist") }
                .tag(0)
            HistoryView()
                .tabItem { Label("History", systemImage: "chart.line.uptrend.xyaxis") }
                .tag(1)
            AccountView()
                .tabItem { Label("Account", systemImage: "person.crop.circle") }
                .tag(2)
        }
        .tint(Theme.primary)
    }
}

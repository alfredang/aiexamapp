import SwiftUI

struct RootView: View {
    var body: some View {
        MainTabView()
    }
}

struct MainTabView: View {
    @EnvironmentObject private var session: SessionStore

    var body: some View {
        TabView {
            LibraryView()
                .tabItem { Label("My Exams", systemImage: "checklist.checked") }
            CatalogView()
                .tabItem { Label("Catalog", systemImage: "magnifyingglass") }
            if session.user?.isStaffMember == true {
                StaffView()
                    .tabItem { Label("Staff", systemImage: "clock.badge.checkmark") }
            }
            AccountView()
                .tabItem { Label("Account", systemImage: "person.crop.circle") }
        }
    }
}

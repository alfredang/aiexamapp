import SwiftUI

struct RootView: View {
    var body: some View {
        MainTabView()
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            LibraryView()
                .tabItem { Label("My Exams", systemImage: "checklist.checked") }
            CatalogView()
                .tabItem { Label("Catalog", systemImage: "magnifyingglass") }
            AccountView()
                .tabItem { Label("Account", systemImage: "person.crop.circle") }
        }
    }
}

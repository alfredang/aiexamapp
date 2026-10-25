import SwiftUI

@main
struct AIExamsApp: App {
    @StateObject private var session = SessionStore()
    @StateObject private var launcher = ExamLauncher()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(session)
                .environmentObject(launcher)
                .fullScreenCover(item: $launcher.active, onDismiss: { launcher.closed() }) { route in
                    AttemptFlowView(attemptId: route.id, showResults: route.showResults)
                        .environmentObject(session)
                        .environmentObject(launcher)
                }
                .alert("Couldn't start the exam", isPresented: Binding(get: { launcher.errorMessage != nil }, set: { if !$0 { launcher.errorMessage = nil } })) {
                    Button("OK", role: .cancel) {}
                } message: {
                    Text(launcher.errorMessage ?? "")
                }
                #if DEBUG
                .task { await ScreenshotAutomation.run(session: session, launcher: launcher) }
                #endif
                .onChange(of: session.isSignedIn) { _, signedIn in
                    if !signedIn { launcher.active = nil }
                }
        }
    }
}

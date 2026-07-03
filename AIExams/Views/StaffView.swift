import SwiftUI

struct StaffView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var timesheet: TimesheetResponse?
    @State private var claims: [StaffClaim] = []
    @State private var isClocking = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if session.token == nil {
                    AuthRequiredView(message: "Sign in with your staff account to clock in and submit claims.")
                } else {
                    List {
                        timeClockSection
                        claimsSection
                        recentClaimsSection
                        recentShiftsSection
                    }
                    .refreshable { await load() }
                }
            }
            .navigationTitle("Staff")
            .task {
                if session.token != nil {
                    await load()
                }
            }
        }
    }

    // MARK: Time clock

    private var timeClockSection: some View {
        Section {
            VStack(spacing: 14) {
                if let active = timesheet?.active, let start = StaffDates.parse(active.clockInAt) {
                    VStack(spacing: 4) {
                        Label("Clocked in", systemImage: "clock.fill")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Theme.secondary)
                        Text("since \(start.formatted(date: .omitted, time: .shortened))")
                            .font(.footnote)
                            .foregroundStyle(Theme.mutedInk)
                        TimelineView(.periodic(from: .now, by: 60)) { context in
                            Text(elapsedText(from: start, to: context.date))
                                .font(.system(size: 40, weight: .bold, design: .rounded))
                                .monospacedDigit()
                        }
                    }
                } else {
                    VStack(spacing: 4) {
                        Label("Clocked out", systemImage: "clock")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Theme.mutedInk)
                        Text("Tap below when you start work.")
                            .font(.footnote)
                            .foregroundStyle(Theme.mutedInk)
                    }
                }

                Button {
                    Task { await toggleClock() }
                } label: {
                    if isClocking {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 6)
                    } else {
                        Label(
                            timesheet?.active == nil ? "Clock In" : "Clock Out",
                            systemImage: timesheet?.active == nil ? "play.circle.fill" : "stop.circle.fill"
                        )
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(timesheet?.active == nil ? Theme.secondary : .red)
                .disabled(isClocking || timesheet == nil)

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        } header: {
            Text("Time Clock")
        } footer: {
            if let weekMinutes = timesheet?.weekMinutes {
                Text("This week: \(StaffDates.hoursMinutes(weekMinutes))")
            }
        }
    }

    // MARK: Claims

    private var claimsSection: some View {
        Section("Submit a Claim") {
            ForEach(ClaimType.allCases) { type in
                NavigationLink {
                    NewClaimView(type: type) {
                        Task { await load() }
                    }
                } label: {
                    Label(type.title, systemImage: type.icon)
                        .foregroundStyle(Theme.ink)
                }
            }
        }
    }

    @ViewBuilder
    private var recentClaimsSection: some View {
        if !claims.isEmpty {
            Section("Recent Claims") {
                ForEach(claims.prefix(10)) { claim in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(claim.title)
                                .font(.subheadline.weight(.semibold))
                            Spacer()
                            if let amount = claim.amount {
                                Text(amount, format: .currency(code: claim.currency ?? "SGD"))
                                    .font(.subheadline)
                            }
                        }
                        HStack {
                            Text(claim.type.title)
                            Text("·")
                            Text(StaffDates.display(claim.createdAt))
                            Spacer()
                            Text(claim.status.capitalized)
                                .font(.caption.weight(.semibold))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(statusColor(claim.status).opacity(0.15), in: Capsule())
                                .foregroundStyle(statusColor(claim.status))
                        }
                        .font(.caption)
                        .foregroundStyle(Theme.mutedInk)
                    }
                    .padding(.vertical, 2)
                }
            }
        }
    }

    @ViewBuilder
    private var recentShiftsSection: some View {
        if let entries = timesheet?.entries, !entries.isEmpty {
            Section("Recent Shifts") {
                ForEach(entries.prefix(10)) { entry in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(StaffDates.display(entry.clockInAt))
                                .font(.subheadline)
                            if let out = entry.clockOutAt {
                                Text("to \(StaffDates.display(out))")
                                    .font(.caption)
                                    .foregroundStyle(Theme.mutedInk)
                            } else {
                                Text("In progress")
                                    .font(.caption)
                                    .foregroundStyle(Theme.secondary)
                            }
                        }
                        Spacer()
                        if let minutes = entry.minutes {
                            Text(StaffDates.hoursMinutes(minutes))
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(Theme.primary)
                        }
                    }
                }
            }
        }
    }

    // MARK: Actions

    private func load() async {
        do {
            timesheet = try await session.api.timesheet()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
        claims = (try? await session.api.claims())?.claims ?? claims
    }

    private func toggleClock() async {
        isClocking = true
        defer { isClocking = false }
        do {
            if timesheet?.active == nil {
                _ = try await session.api.clockIn()
            } else {
                _ = try await session.api.clockOut()
            }
            errorMessage = nil
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func elapsedText(from start: Date, to now: Date) -> String {
        let minutes = max(0, Int(now.timeIntervalSince(start)) / 60)
        return String(format: "%d:%02d", minutes / 60, minutes % 60)
    }

    private func statusColor(_ status: String) -> Color {
        switch status.uppercased() {
        case "APPROVED": .green
        case "REJECTED": .red
        default: Theme.highlight
        }
    }
}

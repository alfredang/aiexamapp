import Foundation

extension User {
    /// Staff-only features (claims, timesheet) are shown when the backend marks
    /// the account with one of these roles. Regular exam customers never see them.
    var isStaffMember: Bool {
        ["staff", "admin", "intern", "contractor"].contains(role.lowercased())
    }
}

enum ClaimType: String, Codable, CaseIterable, Identifiable {
    case expense = "EXPENSE"
    case medical = "MEDICAL"

    var id: String { rawValue }
    var title: String { self == .expense ? "Expense Claim" : "Medical Claim" }
    var icon: String { self == .expense ? "doc.text.viewfinder" : "cross.case" }
}

struct StaffClaim: Codable, Identifiable {
    let id: String
    let type: ClaimType
    let title: String
    let amount: Double?
    let currency: String?
    let note: String?
    let status: String
    let createdAt: String
    let driveFileUrl: String?
}

struct SubmitClaimRequest: Codable {
    let type: ClaimType
    let title: String
    let amount: Double?
    let currency: String?
    let note: String?
    let photoBase64: String
    let filename: String
    let contentType: String
}

struct ClaimResponse: Codable {
    let claim: StaffClaim
}

struct ClaimsListResponse: Codable {
    let claims: [StaffClaim]
}

struct TimesheetEntry: Codable, Identifiable {
    let id: String
    let clockInAt: String
    let clockOutAt: String?
    let minutes: Int?
    let note: String?
}

struct TimesheetResponse: Codable {
    let active: TimesheetEntry?
    let entries: [TimesheetEntry]
    let weekMinutes: Int?
}

struct ClockRequest: Codable {
    let note: String?
}

struct ClockResponse: Codable {
    let entry: TimesheetEntry
}

enum StaffDates {
    private static let isoFractional: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
    private static let iso = ISO8601DateFormatter()

    static func parse(_ string: String) -> Date? {
        isoFractional.date(from: string) ?? iso.date(from: string)
    }

    static func display(_ string: String) -> String {
        guard let date = parse(string) else { return string }
        return date.formatted(date: .abbreviated, time: .shortened)
    }

    static func hoursMinutes(_ minutes: Int) -> String {
        "\(minutes / 60)h \(minutes % 60)m"
    }
}

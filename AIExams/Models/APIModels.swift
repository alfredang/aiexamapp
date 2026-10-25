import Foundation

// DTOs for the /api/mobile/* JSON contract served by exams.tertiaryinfotech.com.
// Keep in sync with src/app/api/mobile/* in the website repo (ai-exams).

struct User: Codable, Identifiable, Equatable {
    let id: String
    let email: String
    let name: String?
    let role: String
}

struct AuthResponse: Codable {
    let token: String
    let user: User
}

enum CodePurpose: String, Codable {
    case login = "LOGIN"
    case register = "REGISTER"
}

struct OkResponse: Codable {
    let ok: Bool?
}

// MARK: - Library (owned practice exams)

struct LibraryResponse: Codable {
    let bundles: [LibraryBundle]
    let standalone: [LibraryExam]

    /// One row per certification, newest grant first. A certification can be
    /// owned at several tiers (purchase + grant); the app only needs it once.
    var exams: [LibraryExam] {
        var seen = Set<String>()
        return (bundles.flatMap(\.items) + standalone).filter { seen.insert($0.examId).inserted }
    }
}

struct LibraryBundle: Codable, Identifiable {
    let bundleId: String
    let bundleTitle: String
    let vendorName: String
    let code: String
    let items: [LibraryExam]

    var id: String { bundleId }
}

struct LibraryExam: Codable, Identifiable, Hashable {
    let entitlementId: String
    let examId: String
    let examTitle: String
    let examCode: String
    let questionCount: Int
    let durationMinutes: Int
    let vendorName: String
    let tier: String

    var id: String { examId }
    var code: String { examCode.strippingVariant }
}

// MARK: - History

struct HistoryResponse: Codable {
    let attempts: [HistoryAttempt]
    let exams: [ExamSummary]
}

struct HistoryAttempt: Codable, Identifiable, Hashable {
    let id: String
    let examId: String
    let examCode: String
    let examTitle: String
    let mode: ExamMode
    let isTeaser: Bool
    let startedAt: String
    let inProgress: Bool
    let expiresAt: String?
    let score: Int?
    let correct: Int
    let total: Int
    let passed: Bool?
    let timeUsedSec: Int?

    var startedDate: Date? { ISO8601.parse(startedAt) }

    /// An unfinished attempt that can still be continued (Exam mode stops at its expiry).
    var isResumable: Bool {
        guard inProgress, !isTeaser else { return false }
        guard let expiresAt, let end = ISO8601.parse(expiresAt) else { return true }
        return end > Date()
    }
}

struct ExamSummary: Codable, Identifiable, Hashable {
    let examId: String
    let code: String
    let title: String
    let vendorName: String
    let passingScore: Int
    let best: Int?
    let average: Int?
    let latest: Int?
    let domains: [DomainStat]
    let attemptCount: Int

    var id: String { examId }
}

struct DomainStat: Codable, Hashable {
    let name: String
    let correct: Int
    let total: Int

    var percent: Int { total == 0 ? 0 : Int((Double(correct) / Double(total) * 100).rounded()) }
}

// MARK: - Attempts

enum ExamMode: String, Codable, CaseIterable, Identifiable {
    case practice = "PRACTICE"
    case exam = "EXAM"

    var id: String { rawValue }
    var title: String { self == .practice ? "Practice mode" : "Exam mode" }
}

struct StartAttemptRequest: Codable {
    let examId: String
    let mode: ExamMode
}

struct StartAttemptResponse: Codable {
    let attemptId: String
}

struct AttemptResponse: Codable {
    let attempt: Attempt
    let exam: AttemptExam
    let questions: [Question]
    let result: AttemptScore?
}

struct Attempt: Codable, Identifiable {
    let id: String
    let mode: ExamMode
    let isTeaser: Bool
    let startedAt: String
    let submittedAt: String?
    let expiresAt: String?
    let durationSec: Int
    let remainingSec: Int?
    let score: Double?
    let passed: Bool?
    let responses: [String: SavedResponse]
}

struct AttemptExam: Codable, Identifiable {
    let id: String
    let title: String
    let code: String
    let vendorName: String
    let passingScore: Int
}

struct Question: Codable, Identifiable {
    let id: String
    let stem: String
    let type: QuestionType
    let domain: String
    let options: [QuestionOption]
    let selectCount: Int?
    let steps: [QuestionOption]?
    let correct: [String]?
    let explanation: String?
    let references: [Reference]?

    enum CodingKeys: String, CodingKey {
        case id, stem, type, domain, options, selectCount, steps, correct, explanation, references
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        stem = try c.decode(String.self, forKey: .stem)
        type = (try? c.decode(QuestionType.self, forKey: .type)) ?? .single
        domain = (try? c.decode(String.self, forKey: .domain)) ?? ""
        options = try c.decode([QuestionOption].self, forKey: .options)
        selectCount = try? c.decodeIfPresent(Int.self, forKey: .selectCount)
        steps = try? c.decodeIfPresent([QuestionOption].self, forKey: .steps)
        correct = try? c.decodeIfPresent([String].self, forKey: .correct)
        explanation = try? c.decodeIfPresent(String.self, forKey: .explanation)
        references = Reference.decodeList(c, key: .references)
    }

    /// How many options the candidate must pick.
    var requiredCount: Int {
        switch type {
        case .multi: max(selectCount ?? correct?.count ?? 2, 1)
        case .ordering: (steps ?? options).count
        default: 1
        }
    }

    /// Options in display order: ORDERING uses the fixed Step 1…N labelling.
    var displayOptions: [QuestionOption] { type == .ordering ? (steps ?? options) : options }
}

enum QuestionType: String, Codable {
    case single = "SINGLE"
    case multi = "MULTI"
    case trueFalse = "TRUE_FALSE"
    case ordering = "ORDERING"
    case hotspot = "HOTSPOT"
}

struct QuestionOption: Codable, Identifiable, Hashable {
    let id: String
    let text: String
}

/// `Question.references` is historically URL strings or `{url,label}` objects
/// (or null). Only valid http(s) links are kept.
struct Reference: Codable, Hashable {
    let url: URL
    let label: String?

    static func decodeList<K: CodingKey>(_ c: KeyedDecodingContainer<K>, key: K) -> [Reference]? {
        guard let raw = try? c.decodeIfPresent([LooseReference].self, forKey: key) else { return nil }
        let list = raw.compactMap(\.reference)
        return list.isEmpty ? nil : list
    }
}

private struct LooseReference: Decodable {
    let reference: Reference?

    init(from decoder: Decoder) throws {
        func make(_ s: String?, _ label: String?) -> Reference? {
            guard let s, let url = URL(string: s), ["http", "https"].contains(url.scheme?.lowercased() ?? "") else { return nil }
            return Reference(url: url, label: label)
        }
        if let s = try? decoder.singleValueContainer().decode(String.self) {
            reference = make(s, nil)
        } else if let o = try? decoder.singleValueContainer().decode([String: String?].self) {
            reference = make(o["url"] ?? nil, (o["label"] ?? nil) ?? (o["title"] ?? nil))
        } else {
            reference = nil
        }
    }
}

struct SavedResponse: Codable, Equatable {
    var answer: [String]
    var flagged: Bool?
    var timeSpent: Int?
}

struct AnswerRequest: Codable {
    let attemptId: String
    let questionId: String
    let answer: [String]
    let flagged: Bool?
}

struct AnswerResponse: Codable {
    let saved: Bool
    let isCorrect: Bool?
    let correct: [String]?
    let explanation: String?
}

struct MarkRequest: Codable {
    let attemptId: String
    let questionId: String
    let flagged: Bool
}

struct SubmitRequest: Codable {
    let attemptId: String
}

struct SubmitResponse: Codable {
    let score: Double?
    let passed: Bool?
}

struct AttemptScore: Codable {
    let score: Double
    let correctCount: Int?
    let total: Int?
    let perDomain: [String: DomainScore]?
}

struct DomainScore: Codable {
    let correct: Int
    let total: Int
}

// MARK: - Helpers

enum ISO8601 {
    private static let fractional: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private static let plain = ISO8601DateFormatter()

    static func parse(_ s: String) -> Date? { fractional.date(from: s) ?? plain.date(from: s) }
}

extension String {
    /// "AIF-C01-P1" → "AIF-C01" (retired practice-exam variants).
    var strippingVariant: String { replacingOccurrences(of: #"-P\d+$"#, with: "", options: .regularExpression) }
}

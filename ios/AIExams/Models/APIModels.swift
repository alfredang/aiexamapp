import Foundation

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let name: String?
    let role: String
}

struct AuthResponse: Codable {
    let token: String
    let user: User
}

struct Vendor: Codable, Identifiable {
    let id: String
    let slug: String
    let name: String
    let description: String?
}

struct CatalogResponse: Codable {
    let vendors: [Vendor]
    let bundles: [CatalogBundle]
}

struct CatalogBundle: Codable, Identifiable {
    let id: String
    let slug: String
    let title: String
    let description: String
    let vendor: CatalogVendor?
    let code: String
    let level: String
    let totalQuestions: Int
    let practiceExamCount: Int
    let exams: [CatalogExam]
}

struct CatalogVendor: Codable {
    let slug: String
    let name: String
}

struct CatalogExam: Codable, Identifiable {
    let id: String
    let slug: String
    let code: String
    let title: String
    let level: String
    let durationMinutes: Int
    let passingScore: Int
    let questionCount: Int
    let publishedQuestionCount: Int
    let position: Int
}

struct LibraryResponse: Codable {
    let bundles: [LibraryBundle]
    let standalone: [LibraryExam]
}

struct LibraryBundle: Codable, Identifiable {
    let bundleId: String
    let bundleSlug: String
    let bundleTitle: String
    let bundleDescription: String
    let vendorName: String
    let vendorSlug: String
    let code: String
    let level: String
    let items: [LibraryExam]
    let hasVoucher: Bool
    let grantedAt: String

    var id: String { bundleId }
}

struct LibraryExam: Codable, Identifiable {
    let entitlementId: String
    let examId: String
    let examSlug: String
    let examTitle: String
    let examCode: String
    let questionCount: Int
    let durationMinutes: Int
    let vendorName: String
    let vendorSlug: String
    let tier: String
    let grantedAt: String

    var id: String { entitlementId }
}

struct StartAttemptRequest: Codable {
    let examId: String
    let mode: ExamMode
    let teaser: Bool?
}

struct StartAttemptResponse: Codable {
    let attemptId: String
}

enum ExamMode: String, Codable, CaseIterable, Identifiable {
    case practice = "PRACTICE"
    case exam = "EXAM"

    var id: String { rawValue }
    var title: String { self == .practice ? "Practice" : "Exam" }
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
    let correct: [String]?
    let explanation: String?
}

enum QuestionType: String, Codable {
    case single = "SINGLE"
    case multi = "MULTI"
    case trueFalse = "TRUE_FALSE"
    case ordering = "ORDERING"
    case hotspot = "HOTSPOT"
}

struct QuestionOption: Codable, Identifiable {
    let id: String
    let text: String
}

struct SavedResponse: Codable {
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

struct SubmitRequest: Codable {
    let attemptId: String
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

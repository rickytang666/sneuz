import Foundation

struct SleepSession: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let startTime: Date
    let endTime: Date?
    let source: String
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case startTime = "start_time"
        case endTime = "end_time"
        case source
        case updatedAt = "updated_at"
    }
}

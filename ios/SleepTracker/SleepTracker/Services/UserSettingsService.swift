import Foundation
import Supabase
import Combine

// Models mirroring DB tables
struct UserProfile: Codable {
    let id: UUID
    let fullName: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case fullName = "full_name"
    }
}

struct UserSettings: Codable {
    let userId: UUID
    let targetBedtime: String // Format "HH:mm:ss"
    let targetWakeTime: String // Format "HH:mm:ss"
    let timezone: String
    
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case targetBedtime = "target_bedtime"
        case targetWakeTime = "target_wake_time"
        case timezone
    }
}

class UserSettingsService: ObservableObject {
    static let shared = UserSettingsService()
    private let client = Supabase.client
    
    @Published var profile: UserProfile?
    @Published var settings: UserSettings?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    @MainActor
    func fetchData() async {
        guard let userId = AuthService.shared.user?.id else { return }
        
        isLoading = true
        defer { isLoading = false }
        
        do {
            // Fetch Profile
            let profileResponse: UserProfile = try await client
                .from("profiles")
                .select("id, full_name")
                .eq("id", value: userId)
                .single()
                .execute()
                .value
            
            self.profile = profileResponse
            
            // Fetch Settings
            let settingsResponse: UserSettings = try await client
                .from("user_settings")
                .select()
                .eq("user_id", value: userId)
                .single()
                .execute()
                .value
            
            self.settings = settingsResponse
            
        } catch {
            print("Error fetching user data: \(error)")
            self.errorMessage = error.localizedDescription
        }
    }
    
    @MainActor
    func updateProfile(fullName: String) async throws {
        guard let userId = AuthService.shared.user?.id else { return }
        
        do {
            try await client
                .from("profiles")
                .update(["full_name": fullName])
                .eq("id", value: userId)
                .execute()
            
            // Optimistic update
            if let current = profile {
                self.profile = UserProfile(id: current.id, fullName: fullName)
            }
        } catch {
            self.errorMessage = error.localizedDescription
            throw error
        }
    }
    
    @MainActor
    func updateSettings(bedtime: Date, wakeTime: Date) async throws {
        guard let userId = AuthService.shared.user?.id else { return }
        
        // Format dates to HH:mm:ss
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        
        let bedtimeString = formatter.string(from: bedtime)
        let wakeTimeString = formatter.string(from: wakeTime)
        
        do {
            let updates = [
                "target_bedtime": bedtimeString,
                "target_wake_time": wakeTimeString
            ]
            
            try await client
                .from("user_settings")
                .update(updates)
                .eq("user_id", value: userId)
                .execute()
            
            // Optimistic update
            if let current = settings {
                self.settings = UserSettings(
                    userId: current.userId,
                    targetBedtime: bedtimeString,
                    targetWakeTime: wakeTimeString,
                    timezone: current.timezone
                )
            }
        } catch {
            self.errorMessage = error.localizedDescription
            throw error
        }
    }
}

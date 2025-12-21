import Foundation
import Supabase
import Combine

class SleepSessionService: ObservableObject {
    static let shared = SleepSessionService()
    private let client = Supabase.client
    
    @Published var activeSession: SleepSession?
    @Published var sessions: [SleepSession] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    // Start a new sleep session
    @MainActor
    func startSession() async throws {
        guard let user = AuthService.shared.user else { return }
        isLoading = true
        defer { isLoading = false }
        
        let newSession = SleepSession(
            id: UUID(),
            userId: user.id,
            startTime: Date(),
            endTime: nil,
            source: "manual",
            updatedAt: Date()
        )
        
        do {
            // Check for existing active session first?
            // For MVP, just insert.
            // Note: Schema might require end_time, but for active session we want it null. 
            // We assume backend allows null for end_time.
            try await client
                .from("sleep_sessions")
                .insert(newSession)
                .execute()
            
            self.activeSession = newSession
            
            // Update SharedData
            SharedData.shared.isTracking = true
            SharedData.shared.startTime = newSession.startTime
            
            await fetchSessions()
        } catch {
            self.errorMessage = error.localizedDescription
            throw error
        }
    }
    
    // Stop the active session
    @MainActor
    func stopSession() async throws {
        guard let session = activeSession else { return }
        isLoading = true
        defer { isLoading = false }
        
        let endTime = Date()
        
        do {
            try await client
                .from("sleep_sessions")
                .update(["end_time": endTime.ISO8601Format(), "updated_at": endTime.ISO8601Format()])
                .eq("id", value: session.id)
                .execute()
            
            self.activeSession = nil
            
            // Update SharedData
            SharedData.shared.isTracking = false
            SharedData.shared.startTime = nil
            
            await fetchSessions()
            await fetchSessions()
        } catch {
            self.errorMessage = error.localizedDescription
            throw error
        }
    }
    
    // Fetch recent sessions
    @MainActor
    func fetchSessions() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let response: [SleepSession] = try await client
                .from("sleep_sessions")
                .select()
                .order("start_time", ascending: false)
                .limit(20)
                .execute()
                .value
            
            self.sessions = response
            
            // Determine if there is an active session (latest one has no end_time)
            if let first = response.first, first.endTime == nil {
                self.activeSession = first
                
                // Sync SharedData
                if !SharedData.shared.isTracking {
                    SharedData.shared.isTracking = true
                    SharedData.shared.startTime = first.startTime
                }
            } else {
                self.activeSession = nil
                
                // Sync SharedData just in case
                if SharedData.shared.isTracking {
                    SharedData.shared.isTracking = false
                    SharedData.shared.startTime = nil
                }
            }
            
        } catch {
            print("Fetch error: \(error)")
            self.errorMessage = error.localizedDescription
        }
    }
}

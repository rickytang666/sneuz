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
        
        // Check local state
        if activeSession != nil {
            print(" widget: startSession - Already tracking locally. Ignoring.")
            return
        }
        
        isLoading = true
        defer { isLoading = false }
        
        do {
            // Check for existing active session remotely (Race condition / Fresh state check)
            let existingSessions: [SleepSession] = try await client
                .from("sleep_sessions")
                .select()
                .is("end_time", value: nil)
                .limit(1)
                .execute()
                .value
            
            if let existing = existingSessions.first {
                print(" widget: startSession - Found existing remote session. Resuming.")
                self.activeSession = existing
                
                // Update SharedData
                SharedData.shared.isTracking = true
                SharedData.shared.startTime = existing.startTime
                return
            }
            
            // Proceed to create new session
            let newSession = SleepSession(
                id: UUID(),
                userId: user.id,
                startTime: Date(),
                endTime: nil,
                source: "manual",
                updatedAt: Date()
            )
            
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
        print(" widget: SleepSessionService - stopSession called")
        
        var targetSessionId: UUID?
        
        if let session = activeSession {
            targetSessionId = session.id
        } else {
             print(" widget: No local activeSession. Attempting to fetch from DB...")
             // Fetch the open session from DB
             do {
                 let sessions: [SleepSession] = try await client
                     .from("sleep_sessions")
                     .select()
                     .is("end_time", value: nil)
                     .order("start_time", ascending: false)
                     .limit(1)
                     .execute()
                     .value
                 
                 if let found = sessions.first {
                     print(" widget: Found open session in DB: \(found.id)")
                     targetSessionId = found.id
                     self.activeSession = found // Update local state while we are at it
                 }
             } catch {
                 print(" widget: Failed to fetch open session: \(error)")
             }
        }
        
        guard let sessionId = targetSessionId else {
            print(" widget: SleepSessionService - Abort: No active session found locally or remotely.")
            // Even if we fail, if SharedData says we are tracking, we should probably clear it to fix sync
            SharedData.shared.isTracking = false
            return
        }
        
        print(" widget: SleepSessionService - Stopping session \(sessionId)")
        
        isLoading = true
        defer { isLoading = false }
        
        let endTime = Date()
        
        do {
            try await client
                .from("sleep_sessions")
                .update(["end_time": endTime.ISO8601Format(), "updated_at": endTime.ISO8601Format()])
                .eq("id", value: sessionId)
                .execute()
            
            print(" widget: SleepSessionService - DB update success")
            
            self.activeSession = nil
            
            // Update SharedData
            SharedData.shared.isTracking = false
            SharedData.shared.startTime = nil
            
            await fetchSessions()
        } catch {
            print(" widget: SleepSessionService - Stop Error: \(error)")
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
                .limit(60)
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

    // MARK: - CRUD Operations
    
    @MainActor
    func createSession(start: Date, end: Date) async throws {
        guard let user = AuthService.shared.user else { return }
        
        isLoading = true
        defer { isLoading = false }
        
        let newSession = SleepSession(
            id: UUID(),
            userId: user.id,
            startTime: start,
            endTime: end,
            source: "manual",
            updatedAt: Date()
        )
        
        do {
            try await client
                .from("sleep_sessions")
                .insert(newSession)
                .execute()
            
            await fetchSessions()
        } catch {
            self.errorMessage = error.localizedDescription
            throw error
        }
    }
    
    @MainActor
    func updateSession(id: UUID, start: Date, end: Date) async throws {
        isLoading = true
        defer { isLoading = false }
        
        struct UpdateSessionParams: Encodable {
            let start_time: Date
            let end_time: Date
            let updated_at: Date
        }
        
        let updates = UpdateSessionParams(
            start_time: start,
            end_time: end,
            updated_at: Date()
        )
        
        do {
            try await client
                .from("sleep_sessions")
                .update(updates)
                .eq("id", value: id)
                .execute()
            
            await fetchSessions()
        } catch {
            self.errorMessage = error.localizedDescription
            throw error
        }
    }
    
    @MainActor
    func deleteSession(id: UUID) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            try await client
                .from("sleep_sessions")
                .delete()
                .eq("id", value: id)
                .execute()
            
            // If we deleted the active session, clear local state
            if activeSession?.id == id {
                activeSession = nil
                SharedData.shared.isTracking = false
                SharedData.shared.startTime = nil
            }
            
            await fetchSessions()
        } catch {
            self.errorMessage = error.localizedDescription
            throw error
        }
    }
}

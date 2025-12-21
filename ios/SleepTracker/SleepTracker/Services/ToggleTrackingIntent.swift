import Foundation
import AppIntents
import Auth // Explicit import for User properties

struct ToggleTrackingIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Sleep Tracking"
    
    @MainActor
    func perform() async throws -> some IntentResult {
        print(" widget: ToggleTrackingIntent started")
        
        // Ensure auth session is loaded
        await AuthService.shared.refreshSession()
        
        if let user = AuthService.shared.user {
             print(" widget: User found: \(user.id)")
        } else {
             print(" widget: NO USER FOUND")
        }
        
        // Access shared data
        let currentlyTracking = SharedData.shared.isTracking
        print(" widget: currentlyTracking from SharedData: \(currentlyTracking)")
        
        do {
            if currentlyTracking {
                print(" widget: Attempting to STOP session")
                try await SleepSessionService.shared.stopSession()
            } else {
                print(" widget: Attempting to START session")
                try await SleepSessionService.shared.startSession()
            }
            print(" widget: Action completed successfully")
        } catch {
            print(" widget: Action FAILED with error: \(error)")
            // Optionally throw, but logging helps us diagnose silently
            throw error
        }
        
        return .result()
    }
}

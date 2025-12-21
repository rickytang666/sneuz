import Foundation
import AppIntents

struct ToggleTrackingIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Sleep Tracking"
    
    func perform() async throws -> some IntentResult {
        // We need to use the shared service. 
        // Note: This assumes AuthService and SleepSessionService are available in the Widget Target.
        
        // Ensure auth session is loaded (from Keychain)
        // refreshSession() is @MainActor, so we await it.
        await AuthService.shared.refreshSession()
        
        // Access shared data (thread-safe interactions via UserDefaults/unchecked Sendable)
        let currentlyTracking = SharedData.shared.isTracking
        
        if currentlyTracking {
            // Stop Session (MainActor)
            try? await SleepSessionService.shared.stopSession()
        } else {
            // Start Session (MainActor)
            try? await SleepSessionService.shared.startSession()
        }
        
        return .result()
    }
}

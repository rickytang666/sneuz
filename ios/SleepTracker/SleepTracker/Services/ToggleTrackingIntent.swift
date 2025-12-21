import Foundation
import AppIntents

struct ToggleTrackingIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Sleep Tracking"
    
    @MainActor
    func perform() async throws -> some IntentResult {
        // Ensure auth session is loaded
        await AuthService.shared.refreshSession()
        
        // Access shared data
        let currentlyTracking = SharedData.shared.isTracking
        
        if currentlyTracking {
            try await SleepSessionService.shared.stopSession()
        } else {
            try await SleepSessionService.shared.startSession()
        }
        
        return .result()
    }
}

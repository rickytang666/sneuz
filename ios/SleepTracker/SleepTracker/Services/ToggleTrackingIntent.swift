import Foundation
import AppIntents

struct ToggleTrackingIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Sleep Tracking"
    
    func perform() async throws -> some IntentResult {
        // We need to use the shared service. 
        // Note: This assumes AuthService and SleepSessionService are available in the Widget Target.
        
        // Run on MainActor to ensure safe access to UI-related services and avoid async warnings
        try await MainActor.run {
            // Ensure auth session is loaded
            await AuthService.shared.refreshSession()
            
            // Access shared data
            let currentlyTracking = SharedData.shared.isTracking
            
            if currentlyTracking {
                try await SleepSessionService.shared.stopSession()
            } else {
                try await SleepSessionService.shared.startSession()
            }
        }
        
        return .result()
    }
}

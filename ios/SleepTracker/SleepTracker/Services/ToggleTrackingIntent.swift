import Foundation
import AppIntents
import WidgetKit
import Auth

struct StartTrackingIntent: AppIntent {
    static var title: LocalizedStringResource = "Start Sleep Tracking"
    static var description: IntentDescription = "Starts a new sleep session."
    
    @MainActor
    func perform() async throws -> some IntentResult {
        print(" StartTrackingIntent started")
        
        // Ensure auth session is loaded
        await AuthService.shared.refreshSession()
        
        guard AuthService.shared.user != nil else {
            print(" StartTrackingIntent: No user logged in")
            return .result() // Or throw an error
        }
        
        do {
            try await SleepSessionService.shared.startSession()
            WidgetCenter.shared.reloadAllTimelines()
            return .result()
        } catch {
            print(" StartTrackingIntent failed: \(error)")
            throw error
        }
    }
}

struct StopTrackingIntent: AppIntent {
    static var title: LocalizedStringResource = "Stop Sleep Tracking"
    static var description: IntentDescription = "Stops the current sleep session."
    
    @MainActor
    func perform() async throws -> some IntentResult {
        print(" StopTrackingIntent started")
        
        await AuthService.shared.refreshSession()
        
        guard AuthService.shared.user != nil else {
            print(" StopTrackingIntent: No user logged in")
            return .result()
        }
        
        do {
            try await SleepSessionService.shared.stopSession()
            WidgetCenter.shared.reloadAllTimelines()
            return .result()
        } catch {
            print(" StopTrackingIntent failed: \(error)")
            throw error
        }
    }
}

struct ToggleTrackingIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Sleep Tracking"
    
    @MainActor
    func perform() async throws -> some IntentResult {
        print(" ToggleTrackingIntent started")
        
        await AuthService.shared.refreshSession()
        
        if let user = AuthService.shared.user {
             print(" User found: \(user.id)")
        } else {
             print(" NO USER FOUND")
        }
        
        let currentlyTracking = SharedData.shared.isTracking
        
        do {
            if currentlyTracking {
                try await SleepSessionService.shared.stopSession()
            } else {
                try await SleepSessionService.shared.startSession()
            }
            WidgetCenter.shared.reloadAllTimelines()
            return .result()
        } catch {
            print(" ToggleTrackingIntent failed: \(error)")
            throw error
        }
    }
}

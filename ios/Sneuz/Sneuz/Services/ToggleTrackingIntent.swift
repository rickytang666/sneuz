import Foundation
import AppIntents
import WidgetKit
import Auth
import os

let logger = Logger(subsystem: "ricfinity.Sneuz", category: "AppIntents")

struct StartTrackingIntent: AppIntent {
    static var title: LocalizedStringResource = "Start Sleep Tracking"
    static var description: IntentDescription = "Starts a new sleep session."
    
    @MainActor
    func perform() async throws -> some IntentResult {
        logger.info("🟢 StartTrackingIntent: perform() called")
        
        // Ensure auth session is loaded
        await AuthService.shared.refreshSession()
        
        guard AuthService.shared.user != nil else {
            logger.error("🔴 StartTrackingIntent: No user logged in")
            return .result()
        }
        
        if SharedData.shared.isTracking {
            logger.warning("🟡 StartTrackingIntent: Already tracking. Ignoring.")
            throw IntentError.alreadyTracking
        }
        
        do {
            try await SleepSessionService.shared.startSession()
            logger.info("✅ StartTrackingIntent: Session started successfully")
            WidgetCenter.shared.reloadAllTimelines()
            return .result()
        } catch {
            logger.error("🔴 StartTrackingIntent failed: \(error.localizedDescription)")
            throw error
        }
    }
}

enum IntentError: Swift.Error, CustomLocalizedStringResourceConvertible {
    case alreadyTracking
    case notTracking
    
    var localizedStringResource: LocalizedStringResource {
        switch self {
        case .alreadyTracking: return "You are already sleeping."
        case .notTracking: return "You are not currently sleeping."
        }
    }
}

struct StopTrackingIntent: AppIntent {
    static var title: LocalizedStringResource = "Stop Sleep Tracking"
    static var description: IntentDescription = "Stops the current sleep session."
    
    @MainActor
    func perform() async throws -> some IntentResult {
        logger.info("🛑 StopTrackingIntent: perform() called")
        
        await AuthService.shared.refreshSession()
        
        guard AuthService.shared.user != nil else {
            logger.error("🔴 StopTrackingIntent: No user logged in")
            return .result()
        }
        
        if !SharedData.shared.isTracking {
            logger.warning("🟡 StopTrackingIntent: Not tracking. Ignoring.")
            throw IntentError.notTracking
        }
        
        do {
            try await SleepSessionService.shared.stopSession()
            logger.info("✅ StopTrackingIntent: Session stopped successfully")
            WidgetCenter.shared.reloadAllTimelines()
            return .result()
        } catch {
            logger.error("🔴 StopTrackingIntent failed: \(error.localizedDescription)")
            throw error
        }
    }
}

struct ToggleTrackingIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Sleep Tracking"
    
    @MainActor
    func perform() async throws -> some IntentResult {
        logger.info("🔄 ToggleTrackingIntent: perform() called")
        
        await AuthService.shared.refreshSession()
        
        if let user = AuthService.shared.user {
             logger.info("👤 User authenticated: \(user.id)")
        } else {
             logger.error("🔴 ToggleTrackingIntent: NO USER FOUND")
        }
        
        let currentlyTracking = SharedData.shared.isTracking
        logger.info("📊 Current tracking state: \(currentlyTracking)")
        
        do {
            if currentlyTracking {
                logger.info("➡️ Action: Stopping session")
                try await SleepSessionService.shared.stopSession()
            } else {
                logger.info("➡️ Action: Starting session")
                try await SleepSessionService.shared.startSession()
            }
            WidgetCenter.shared.reloadAllTimelines()
            return .result()
        } catch {
            logger.error("🔴 ToggleTrackingIntent failed: \(error.localizedDescription)")
            throw error
        }
    }
}

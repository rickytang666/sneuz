import Foundation
import WidgetKit

import WidgetKit

final class SharedData: @unchecked Sendable {
    static let shared = SharedData()
    
    // Suite name must match the App Group identifier
    private let userDefaults = UserDefaults(suiteName: "group.io.sleeptracker.shared")
    
    private let kIsTracking = "isTracking"
    private let kStartTime = "startTime"
    
    var isTracking: Bool {
        get { userDefaults?.bool(forKey: kIsTracking) ?? false }
        set {
            userDefaults?.set(newValue, forKey: kIsTracking)
            reloadWidget()
        }
    }
    
    var startTime: Date? {
        get { userDefaults?.object(forKey: kStartTime) as? Date }
        set {
            userDefaults?.set(newValue, forKey: kStartTime)
            reloadWidget()
        }
    }
    
    private func reloadWidget() {
        WidgetCenter.shared.reloadAllTimelines()
    }
}

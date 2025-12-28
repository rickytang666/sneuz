import Foundation
import WidgetKit

import WidgetKit

final class SharedData: @unchecked Sendable {
    static let shared = SharedData()
    
    // Suite name must match the App Group identifier
    private let userDefaults = UserDefaults(suiteName: "group.io.sneuz.shared")
    
    private let kIsTracking = "isTracking"
    private let kStartTime = "startTime"
    private let kIsLoggedIn = "isLoggedIn"
    
    var isTracking: Bool {
        get { userDefaults?.bool(forKey: kIsTracking) ?? false }
        set {
            userDefaults?.set(newValue, forKey: kIsTracking)
            reloadWidget()
        }
    }
    
    var isLoggedIn: Bool {
        get { userDefaults?.bool(forKey: kIsLoggedIn) ?? false }
        set {
            userDefaults?.set(newValue, forKey: kIsLoggedIn)
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

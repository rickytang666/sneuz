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

import SwiftUI

extension Color {
    static let brandPurple = Color(red: 0.6941, green: 0.2980, blue: 0.8275)
    static let brandPink = Color(red: 1.0, green: 0.6, blue: 0.7)
}

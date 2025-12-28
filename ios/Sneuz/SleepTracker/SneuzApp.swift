//
//  SleepTrackerApp.swift
//  Sneuz
//
//  Created by Ricky Tang on 2025-12-19.
//

import SwiftUI

@main
struct SneuzApp: App {
    @StateObject var authService = AuthService.shared

    var body: some Scene {
        WindowGroup {
            if authService.isAuthenticated {
                MainTabView()
                    .environmentObject(authService)
            } else {
                LoginView()
                    .environmentObject(authService)
            }
        }
    }
}

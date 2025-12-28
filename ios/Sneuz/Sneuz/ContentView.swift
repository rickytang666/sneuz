//
//  ContentView.swift
//  Sneuz
//
//  Created by Ricky Tang on 2025-12-19.
//

import SwiftUI

struct ContentView: View {
    @StateObject private var auth = AuthService.shared
    
    var body: some View {
        Group {
            if auth.isAuthenticated {
                HomeView()
            } else {
                LoginView()
            }
        }
    }
}

#Preview {
    ContentView()
}

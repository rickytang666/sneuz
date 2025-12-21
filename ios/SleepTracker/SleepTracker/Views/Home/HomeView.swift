import SwiftUI

struct HomeView: View {
    @StateObject private var sessionService = SleepSessionService.shared
    @StateObject private var auth = AuthService.shared
    @Environment(\.scenePhase) var scenePhase
    
    var body: some View {
        NavigationView {
            VStack(spacing: 40) {
                // Status Header
                VStack(spacing: 10) {
                    Text(sessionService.activeSession != nil ? "Good Night" : "Ready to Sleep?")
                        .font(.title)
                        .bold()
                    
                    if let start = sessionService.activeSession?.startTime {
                        Text("Sleeping since \(start.formatted(date: .omitted, time: .shortened))")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.top, 50)
                
                Spacer()
                
                // Main Action Button
                Button(action: toggleSession) {
                    ZStack {
                        Circle()
                            .fill(sessionService.activeSession != nil ? Color.orange : Color.indigo)
                            .frame(width: 200, height: 200)
                            .shadow(radius: 10)
                        
                        VStack {
                            Image(systemName: sessionService.activeSession != nil ? "sun.max.fill" : "moon.fill")
                                .font(.system(size: 50))
                                .foregroundColor(.white)
                            
                            Text(sessionService.activeSession != nil ? "Wake Up" : "Start Sleep")
                                .font(.title2)
                                .bold()
                                .foregroundColor(.white)
                        }
                    }
                }
                .disabled(sessionService.isLoading)
                
                if let error = sessionService.errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                if sessionService.isLoading {
                    ProgressView()
                }
                
                Spacer()
                
                // Navigation to History
                NavigationLink(destination: HistoryListView()) {
                    Text("View History")
                        .foregroundColor(.blue)
                }
                .padding(.bottom, 20)
                
                // Sign Out (Temporary, for testing)
                Button("Sign Out") {
                    Task {
                        try? await auth.signOut()
                    }
                }
                .foregroundColor(.red)
                .padding(.bottom, 20)
            }
            .navigationBarHidden(true)
            .onAppear {
                Task {
                    await sessionService.fetchSessions()
                }
            }
        }
        .onChange(of: scenePhase) { newPhase in
            if newPhase == .active {
                Task {
                    await sessionService.fetchSessions()
                }
            }
        }
    }
    
    private func toggleSession() {
        Task {
            do {
                if sessionService.activeSession != nil {
                    try await sessionService.stopSession()
                } else {
                    try await sessionService.startSession()
                }
            } catch {
                // Error handling handled by Service publishing errorMessage
            }
        }
    }
}

import SwiftUI
import Supabase

struct SettingsView: View {
    @StateObject private var settingsService = UserSettingsService.shared
    @EnvironmentObject var authService: AuthService
    
    @State private var fullName: String = ""
    @State private var bedtime: Date = Date()
    @State private var wakeTime: Date = Date()
    // Debounce/local state management could be added, but for MVP we might commit on change or use a "Save" button?
    // Let's use "onChange" with a slight delay or just commit immediately. 
    // Or better: Form style with "Enter" or "Lose Focus" logic for text, but Stepper commits immediately.
    
    var body: some View {
        Form {
            Section(header: Text("Profile")) {
                if let email = authService.user?.email {
                    HStack {
                        Text("Email")
                        Spacer()
                        Text(email)
                            .foregroundColor(.secondary)
                    }
                }
                
                TextField("Full Name", text: $fullName)
                    .onSubmit {
                        Task {
                            try? await settingsService.updateProfile(fullName: fullName)
                        }
                    }
            }
            
            Section(header: Text("Sleep Goals")) {
                DatePicker("Target Bedtime", selection: $bedtime, displayedComponents: .hourAndMinute)
                    .onChange(of: bedtime) { oldValue, newValue in
                        saveSettings()
                    }
                
                DatePicker("Target Wake Up", selection: $wakeTime, displayedComponents: .hourAndMinute)
                    .onChange(of: wakeTime) { oldValue, newValue in
                        saveSettings()
                    }
            }
            
            if let error = settingsService.errorMessage {
                Section {
                    Text(error)
                        .foregroundColor(.red)
                }
            }
            
            Section {
                Button("Sign Out", role: .destructive) {
                    Task {
                        try? await authService.signOut()
                    }
                }
            }
        }
        .navigationTitle("Settings")
        .onAppear {
            Task {
                await settingsService.fetchData()
                if let profile = settingsService.profile {
                    self.fullName = profile.fullName ?? ""
                }
                if let settings = settingsService.settings {
                    // Parse strings "HH:mm:ss" to Date
                    let formatter = DateFormatter()
                    formatter.dateFormat = "HH:mm:ss"
                    formatter.locale = Locale(identifier: "en_US_POSIX")
                    
                    if let bedDate = formatter.date(from: settings.targetBedtime) {
                        self.bedtime = normalizeDate(bedDate)
                    }
                    if let wakeDate = formatter.date(from: settings.targetWakeTime) {
                        self.wakeTime = normalizeDate(wakeDate)
                    }
                }
            }
        }
        .refreshable {
            await settingsService.fetchData()
        }
    }
    
    // Helper to call save
    private func saveSettings() {
        Task {
            try? await settingsService.updateSettings(bedtime: bedtime, wakeTime: wakeTime)
        }
    }
    
    // Helper to make the time current day for picker consistency
    private func normalizeDate(_ date: Date) -> Date {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.hour, .minute, .second], from: date)
        return calendar.date(from: components) ?? Date()
    }
}

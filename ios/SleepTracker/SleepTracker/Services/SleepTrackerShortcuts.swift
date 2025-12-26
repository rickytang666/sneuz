import AppIntents

struct SleepTrackerShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: StartTrackingIntent(),
            phrases: [
                "Start sleep tracking in \(.applicationName)",
                "Start sleeping in \(.applicationName)",
                "Go to sleep in \(.applicationName)"
            ],
            shortTitle: "Start Tracking",
            systemImageName: "moon.stars.fill"
        )
        
        AppShortcut(
            intent: StopTrackingIntent(),
            phrases: [
                "Stop sleep tracking in \(.applicationName)",
                "Wake up in \(.applicationName)",
                "Stop sleeping in \(.applicationName)"
            ],
            shortTitle: "Stop Tracking",
            systemImageName: "sun.max.fill"
        )
    }
}

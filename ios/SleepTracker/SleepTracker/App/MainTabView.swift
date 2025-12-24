import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            // Sleep Tab
            HomeView()
                .tabItem {
                    Label("Sleep", systemImage: "bed.double.fill")
                }
            
            // Data Tab
            NavigationStack {
                HistoryListView()
            }
            .tabItem {
                Label("Data", systemImage: "list.bullet")
            }
            
            // Stats Tab
            NavigationStack {
                StatsView()
            }
            .tabItem {
                Label("Stats", systemImage: "chart.bar.fill")
            }
            
            // Settings Tab
            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape.fill")
            }
        }
    }
}

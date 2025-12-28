import WidgetKit
import SwiftUI
import AppIntents

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), isTracking: false, startTime: nil, isLoggedIn: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        let isTracking = SharedData.shared.isTracking
        let startTime = SharedData.shared.startTime
        let isLoggedIn = SharedData.shared.isLoggedIn
        let entry = SimpleEntry(date: Date(), isTracking: isTracking, startTime: startTime, isLoggedIn: isLoggedIn)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let isTracking = SharedData.shared.isTracking
        let startTime = SharedData.shared.startTime
        let isLoggedIn = SharedData.shared.isLoggedIn
        
        // Create an entry for right now
        let entry = SimpleEntry(date: Date(), isTracking: isTracking, startTime: startTime, isLoggedIn: isLoggedIn)

        // Refresh timeline whenever shared data changes or every 15 mins
        // Note: WidgetCenter.reloadAllTimelines() from Main App is the primary trigger.
        let timeline = Timeline(entries: [entry], policy: .never)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let isTracking: Bool
    let startTime: Date?
    let isLoggedIn: Bool
}

struct SneuzWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack {
            if !entry.isLoggedIn {
                VStack(spacing: 8) {
                    Image(systemName: "person.crop.circle.badge.exclamationmark")
                        .font(.largeTitle)
                        .foregroundColor(.red)
                    Text("Log in bruh")
                        .font(.headline)
                        .foregroundColor(.primary)
                }
            } else {
                if entry.isTracking {
                    VStack(spacing: 4) {
                        Image(systemName: "moon.stars.fill")
                            .font(.title)
                            .foregroundColor(.brandPurple)
                        Text("Sleeping")
                            .font(.headline)
                            .foregroundColor(.primary)
                        if let startTime = entry.startTime {
                            Text(startTime, style: .timer)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                } else {
                    VStack(spacing: 4) {
                        Image(systemName: "sun.max.fill")
                            .font(.title)
                            .foregroundColor(.brandPink)
                        Text("Awake")
                            .font(.headline)
                            .foregroundColor(.primary)
                    }
                }
                
                Spacer().frame(height: 12)
                
                Button(intent: ToggleTrackingIntent()) {
                    Text(entry.isTracking ? "Wake Up" : "Sleep")
                        .font(.caption)
                        .fontWeight(.bold)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.brandPurple.opacity(0.1))
                        .cornerRadius(12)
                }
                .buttonStyle(.plain)
            }
        }
        .containerBackground(for: .widget) {
            Color(uiColor: .systemBackground)
        }
    }
}

@main
struct SneuzWidget: Widget {
    let kind: String = "SneuzWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            SneuzWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Sneuz")
        .description("Quickly start or stop sleep tracking.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

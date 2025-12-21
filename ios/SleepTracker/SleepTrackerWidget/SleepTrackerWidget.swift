import WidgetKit
import SwiftUI
import AppIntents

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), isTracking: false, startTime: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        let isTracking = SharedData.shared.isTracking
        let startTime = SharedData.shared.startTime
        let entry = SimpleEntry(date: Date(), isTracking: isTracking, startTime: startTime)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let isTracking = SharedData.shared.isTracking
        let startTime = SharedData.shared.startTime
        
        // Create an entry for right now
        let entry = SimpleEntry(date: Date(), isTracking: isTracking, startTime: startTime)

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
}

struct SleepTrackerWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack {
            if entry.isTracking {
                VStack(spacing: 4) {
                    Image(systemName: "moon.stars.fill")
                        .font(.title)
                        .foregroundColor(.indigo)
                    Text("Sleeping")
                        .font(.headline)
                        .foregroundColor(.white)
                    if let startTime = entry.startTime {
                        Text(startTime, style: .timer)
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
            } else {
                VStack(spacing: 4) {
                    Image(systemName: "sun.max.fill")
                        .font(.title)
                        .foregroundColor(.orange)
                    Text("Awake")
                        .font(.headline)
                        .foregroundColor(.white)
                }
            }
            
            Spacer().frame(height: 12)
            
            Button(intent: ToggleTrackingIntent()) {
                Text(entry.isTracking ? "Wake Up" : "Sleep")
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.white.opacity(0.2))
                    .cornerRadius(12)
            }
            .buttonStyle(.plain) // Important for Widgets
        }
        .containerBackground(Color(red: 0.1, green: 0.1, blue: 0.12), for: .widget)
    }
}

@main
struct SleepTrackerWidget: Widget {
    let kind: String = "SleepTrackerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            SleepTrackerWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Sleep Tracker")
        .description("Quickly start or stop sleep tracking.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

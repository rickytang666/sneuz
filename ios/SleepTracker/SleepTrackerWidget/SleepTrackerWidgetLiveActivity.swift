//
//  SleepTrackerWidgetLiveActivity.swift
//  SleepTrackerWidget
//
//  Created by Ricky Tang on 2025-12-20.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct SleepTrackerWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct SleepTrackerWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: SleepTrackerWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension SleepTrackerWidgetAttributes {
    fileprivate static var preview: SleepTrackerWidgetAttributes {
        SleepTrackerWidgetAttributes(name: "World")
    }
}

extension SleepTrackerWidgetAttributes.ContentState {
    fileprivate static var smiley: SleepTrackerWidgetAttributes.ContentState {
        SleepTrackerWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: SleepTrackerWidgetAttributes.ContentState {
         SleepTrackerWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: SleepTrackerWidgetAttributes.preview) {
   SleepTrackerWidgetLiveActivity()
} contentStates: {
    SleepTrackerWidgetAttributes.ContentState.smiley
    SleepTrackerWidgetAttributes.ContentState.starEyes
}

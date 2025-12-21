//
//  SleepTrackerWidgetBundle.swift
//  SleepTrackerWidget
//
//  Created by Ricky Tang on 2025-12-20.
//

import WidgetKit
import SwiftUI

@main
struct SleepTrackerWidgetBundle: WidgetBundle {
    var body: some Widget {
        SleepTrackerWidget()
        SleepTrackerWidgetControl()
        SleepTrackerWidgetLiveActivity()
    }
}

import SwiftUI
import Charts

enum StatsRange: String, CaseIterable {
    case week = "W"
    case month = "M"
    
    var days: Int {
        switch self {
        case .week: return 7
        case .month: return 30
        }
    }
}

struct StatsView: View {
    @StateObject private var sessionService = SleepSessionService.shared
    @StateObject private var settingsService = UserSettingsService.shared
    @State private var selectedRange: StatsRange = .week
    
    // Header Stats
    private var avgTimeInBed: String {
        let sessions = filteredSessions
        guard !sessions.isEmpty else { return "-- hr -- min" }
        
        let totalInterval = sessions.reduce(0) { sum, session in
            guard let end = session.endTime else { return sum }
            return sum + end.timeIntervalSince(session.startTime)
        }
        let avgSeconds = totalInterval / Double(sessions.count)
        let hours = Int(avgSeconds) / 3600
        let minutes = (Int(avgSeconds) % 3600) / 60
        return "\(hours)hr \(minutes)min"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            
            // Picker
            Picker("Range", selection: $selectedRange) {
                ForEach(StatsRange.allCases, id: \.self) { range in
                    Text(range.rawValue).tag(range)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            
            // Header
            VStack(alignment: .leading, spacing: 4) {
                Text("AVG. TIME IN BED")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(.secondary)
                
                Text(avgTimeInBed)
                    .font(.system(size: 32, weight: .semibold, design: .default))
                    .foregroundStyle(.primary)
                
                Text(selectedRange == .week ? "Last 7 Days" : "Last 30 Days")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.leading)

            // Chart area - wrapped in ScrollView for month view
            if selectedRange == .month {
                ScrollViewReader { proxy in
                    ScrollView(.horizontal, showsIndicators: false) {
                        chartView
                            .frame(width: CGFloat(selectedRange.days) * 24) // ~24pt per day for scrolling
                            .padding(.horizontal)
                            .padding(.trailing, 20) // Extra trailing padding for labels
                            .id("chartContent")
                    }
                    .frame(height: 300)
                    .onAppear {
                        // Scroll to the right (most recent data) on appear
                        proxy.scrollTo("chartContent", anchor: .trailing)
                    }
                }
            } else {
                chartView
                    .frame(height: 300)
                    .padding(.horizontal)
                    .padding(.trailing, 20) // Extra trailing padding for labels
            }
            
            Spacer()
        }
        .navigationTitle("Sleep")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            Task {
                await settingsService.fetchData()
            }
        }
        .refreshable {
            await sessionService.fetchSessions()
            await settingsService.fetchData()
        }
    }
    
    // MARK: - Chart View
    
    private var chartView: some View {
        let chartData = prepareChartData()
        let domain = calculateYDomain(data: chartData)
        
        return Chart {
            ForEach(chartData) { dataPoint in
                if let start = dataPoint.startOffset, let end = dataPoint.endOffset {
                    BarMark(
                        x: .value("Day", dataPoint.day, unit: .day),
                        yStart: .value("Bedtime", start),
                        yEnd: .value("Wake Up", end),
                        width: selectedRange == .week ? .fixed(20) : .fixed(12)
                    )
                    .foregroundStyle(Color.cyan)
                    .cornerRadius(selectedRange == .week ? 5 : 2)
                } else {
                    // Invisible placeholder to ensure X axis exists
                    BarMark(
                        x: .value("Day", dataPoint.day, unit: .day),
                        yStart: .value("Placeholder", domain.min),
                        yEnd: .value("Placeholder", domain.min),
                        width: selectedRange == .week ? .fixed(20) : .fixed(12)
                    )
                    .foregroundStyle(.clear)
                }
            }
            
            // Add Goal Lines
            if let settings = settingsService.settings {
                let bedTarget = normalizeTimeString(settings.targetBedtime)
                let wakeTarget = normalizeTimeString(settings.targetWakeTime)
                
                RuleMark(y: .value("Target Bed", bedTarget))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.green)
                    .annotation(position: .trailing, alignment: .leading) {
                        Text("Target Bed")
                            .font(.caption2)
                            .foregroundStyle(.green)
                            .padding(.leading, 1)
                    }
                
                RuleMark(y: .value("Target Wake", wakeTarget))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
                    .foregroundStyle(.green)
                    .annotation(position: .trailing, alignment: .leading) {
                        Text("Target Wake")
                            .font(.caption2)
                            .foregroundStyle(.green)
                            .padding(.leading, 1)
                    }
            }
        }
        .chartYScale(domain: domain.min...domain.max)
        .chartYAxis {
            AxisMarks(values: .automatic(desiredCount: 5)) { value in
                AxisGridLine()
                AxisTick()
                AxisValueLabel {
                    if let doubleValue = value.as(Double.self) {
                        Text(formatYLabel(doubleValue))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .chartXAxis {
            AxisMarks(values: .stride(by: .day)) { value in
                if selectedRange == .week {
                    AxisGridLine()
                    AxisTick()
                    AxisValueLabel(format: .dateTime.weekday(.narrow), centered: true)
                } else {
                    // For month view, show day numbers
                    AxisValueLabel(format: .dateTime.day(), centered: true)
                }
            }
        }
        .chartXScale(domain: chartStart...chartEnd)
    }
    
    // MARK: - Data Logic
    
    // Calculate the start of the chart (e.g. 7 days ago)
    private var chartStart: Date {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        return calendar.date(byAdding: .day, value: -(selectedRange.days - 1), to: today)!
    }
    
    // Calculate end of chart (end of today for proper domain)
    private var chartEnd: Date {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        // Add 1 day to include today fully in the domain
        return calendar.date(byAdding: .day, value: 1, to: today)!
    }
    
    private var filteredSessions: [SleepSession] {
        let sorted = sessionService.sessions.sorted { $0.startTime > $1.startTime }
        let cutoff = chartStart
        return sorted.filter { session in
            guard let end = session.endTime else { return false }
            return end >= cutoff
        }
    }
    
    struct ChartDataPoint: Identifiable {
        let id = UUID()
        let day: Date
        let startOffset: Double? // Nullable for empty days
        let endOffset: Double?
    }
    
    private func prepareChartData() -> [ChartDataPoint] {
        var points: [ChartDataPoint] = []
        let calendar = Calendar.current
        
        // Iterate from start date to end date
        for i in 0..<selectedRange.days {
            guard let dayDate = calendar.date(byAdding: .day, value: i, to: chartStart) else { continue }
            
            // Find session for this day (based on Wake Time belonging to this day)
            // We match sessions where the wake-up time (endTime) falls on this specific day
            let match = filteredSessions.first { session in
                guard let end = session.endTime else { return false }
                // Get start of day for the wake time
                let endDay = calendar.startOfDay(for: end)
                // Compare with the current day we're processing
                return endDay == dayDate
            }
            
            if let session = match, let end = session.endTime {
                let startH = normalizeHour(date: session.startTime)
                let endH = normalizeHour(date: end)
                
                points.append(ChartDataPoint(day: dayDate, startOffset: startH, endOffset: endH))
            } else {
                // Empty point
                points.append(ChartDataPoint(day: dayDate, startOffset: nil, endOffset: nil))
            }
        }
        return points
    }
    
    private func calculateYDomain(data: [ChartDataPoint]) -> (min: Double, max: Double) {
        // Collect all Y values
        let validPoints = data.compactMap { $0.startOffset } + data.compactMap { $0.endOffset }
        var values = validPoints
        
        // Include targets
        if let settings = settingsService.settings {
            values.append(normalizeTimeString(settings.targetBedtime))
            values.append(normalizeTimeString(settings.targetWakeTime))
        }
        
        guard let dataMin = values.min(), let dataMax = values.max() else {
            return (18, 34) // Default fallback
        }
        
        // Add padding (e.g. 1 hour)
        let paddedMin = floor(dataMin - 1)
        let paddedMax = ceil(dataMax + 1)
        
        return (paddedMin, paddedMax)
    }
    
    private func normalizeHour(date: Date) -> Double {
        let calendar = Calendar.current
        let hour = Double(calendar.component(.hour, from: date))
        let minute = Double(calendar.component(.minute, from: date)) / 60.0
        let value = hour + minute
        
        if value < 15.0 {
            return value + 24.0
        }
        return value
    }
    
    private func normalizeTimeString(_ timeStr: String) -> Double {
        // Format "HH:mm:ss"
        let parts = timeStr.split(separator: ":").compactMap { Double($0) }
        guard parts.count >= 2 else { return 23.0 } // Default
        
        let hour = parts[0]
        let minute = parts[1] / 60.0
        let value = hour + minute
        
        if value < 15.0 {
            return value + 24.0
        }
        return value
    }
    
    private func formatYLabel(_ value: Double) -> String {
        let normalized = Int(value) % 24
        let isPM = normalized >= 12
        let hour12 = normalized > 12 ? normalized - 12 : (normalized == 0 ? 12 : normalized)
        return "\(hour12) \(isPM ? "PM" : "AM")"
    }
}

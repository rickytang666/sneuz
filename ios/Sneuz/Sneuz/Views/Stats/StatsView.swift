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
    
    var barWidth: CGFloat {
        switch self {
        case .week: return 20
        case .month: return 12
        }
    }
    
    var cornerRadius: CGFloat {
        switch self {
        case .week: return 5
        case .month: return 2
        }
    }
}

struct StatsView: View {
    @StateObject private var sessionService = SleepSessionService.shared
    @StateObject private var settingsService = UserSettingsService.shared
    @State private var selectedRange: StatsRange = .week
    @State private var selectedDate: Date?
    @State private var rawSelectedDate: Date?
    
    private let calendar = Calendar.current
    
    // MARK: - Computed Properties
    
    private var avgTimeInBed: String {
        guard !filteredSessions.isEmpty else { return "-- hr -- min" }
        
        let totalInterval = filteredSessions.reduce(0) { sum, session in
            guard let end = session.endTime else { return sum }
            return sum + end.timeIntervalSince(session.startTime)
        }
        let avgSeconds = totalInterval / Double(filteredSessions.count)
        let hours = Int(avgSeconds) / 3600
        let minutes = (Int(avgSeconds) % 3600) / 60
        return "\(hours)hr \(minutes)min"
    }
    
    private var chartStart: Date {
        let today = calendar.startOfDay(for: Date())
        return calendar.date(byAdding: .day, value: -(selectedRange.days - 1), to: today)!
    }
    
    private var chartEnd: Date {
        let today = calendar.startOfDay(for: Date())
        return calendar.date(byAdding: .day, value: 1, to: today)!
    }
    
    private var filteredSessions: [SleepSession] {
        sessionService.sessions
            .filter { session in
                guard let end = session.endTime else { return false }
                return end >= chartStart
            }
            .sorted { $0.startTime > $1.startTime }
    }

    // MARK: - Body
    
    var body: some View {
        ZStack {
            VStack(alignment: .leading, spacing: 20) {
                rangePicker
                statsHeader
                chartContainer
                Spacer()
            }
            .navigationTitle("Stats")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                Task { await settingsService.fetchData() }
            }
            .refreshable {
                await sessionService.fetchSessions()
                await settingsService.fetchData()
            }
            
            // Detail overlay
            if let selectedDate = selectedDate,
               let dataPoint = prepareChartData().first(where: { calendar.isDate($0.day, inSameDayAs: selectedDate) }),
               dataPoint.startOffset != nil {
                detailOverlay(for: dataPoint)
            }
        }
    }
    
    // MARK: - View Components
    
    private var rangePicker: some View {
        Picker("Range", selection: $selectedRange) {
            ForEach(StatsRange.allCases, id: \.self) { range in
                Text(range.rawValue).tag(range)
            }
        }
        .pickerStyle(.segmented)
        .padding(.horizontal)
    }
    
    private var statsHeader: some View {
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
    }
    
    private var chartContainer: some View {
        Group {
            if selectedRange == .month {
                ScrollViewReader { proxy in
                    ScrollView(.horizontal, showsIndicators: false) {
                        chartView
                            .frame(width: CGFloat(selectedRange.days) * 24)
                            .padding(.horizontal)
                            .padding(.trailing, 20)
                            .id("chartContent")
                    }
                    .frame(height: 300)
                    .onAppear {
                        proxy.scrollTo("chartContent", anchor: .trailing)
                    }
                }
            } else {
                chartView
                    .frame(height: 300)
                    .padding(.horizontal)
                    .padding(.trailing, 20)
            }
        }
    }
    
    private func detailOverlay(for dataPoint: ChartDataPoint) -> some View {
        GeometryReader { geometry in
            // Find the session for this data point
            if let session = filteredSessions.first(where: { session in
                guard let end = session.endTime else { return false }
                return calendar.startOfDay(for: end) == dataPoint.day
            }) {
                VStack(spacing: 0) {
                    // Detail card above the line
                    VStack(spacing: 8) {
                        Text(formatDate(dataPoint.day))
                            .font(.caption)
                            .fontWeight(.semibold)
                        
                        HStack(spacing: 16) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Bedtime")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                Text(formatTime(session.startTime))
                                    .font(.caption)
                                    .fontWeight(.medium)
                            }
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Wake")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                Text(formatTime(session.endTime!))
                                    .font(.caption)
                                    .fontWeight(.medium)
                            }
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Duration")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                Text(formatDuration(from: session.startTime, to: session.endTime!))
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundStyle(Color.brandPurple)
                            }
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color(uiColor: .systemBackground))
                    .cornerRadius(8)
                    .shadow(color: .black.opacity(0.1), radius: 4, y: 2)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.bottom, 8)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                .padding(.bottom, 20)
            }
        }
    }
    
    // MARK: - Chart
    
    private var chartView: some View {
        let chartData = prepareChartData()
        let domain = calculateYDomain(data: chartData)
        let yMidpoint = (domain.min + domain.max) / 2.0
        
        return Chart {
            ForEach(chartData) { dataPoint in
                createBarMark(for: dataPoint, domain: domain, yMidpoint: yMidpoint)
            }
            
            
            if let settings = settingsService.settings {
                createTargetLines(settings: settings, yMidpoint: yMidpoint)
            }
            
            // Vertical line for selected date
            if let selectedDate = selectedDate {
                RuleMark(x: .value("Selected", selectedDate, unit: .day))
                    .foregroundStyle(.gray.opacity(0.5))
                    .lineStyle(StrokeStyle(lineWidth: 2))
            }
        }
        .chartYScale(domain: domain.min...domain.max)
        .chartYAxis {
            AxisMarks(values: .automatic(desiredCount: 5)) { value in
                AxisGridLine()
                AxisTick()
                AxisValueLabel {
                    if let doubleValue = value.as(Double.self) {
                        let actualValue = invertY(doubleValue, midpoint: yMidpoint)
                        Text(formatYLabel(actualValue))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .chartXAxis {
            AxisMarks(values: .stride(by: .day)) { _ in
                if selectedRange == .week {
                    AxisGridLine()
                    AxisTick()
                    AxisValueLabel(format: .dateTime.weekday(.narrow), centered: true)
                } else {
                    AxisValueLabel(format: .dateTime.day(), centered: true)
                }
            }
        }
        .chartXScale(domain: chartStart...chartEnd)
        .chartXSelection(value: $rawSelectedDate)
        .onChange(of: rawSelectedDate) { oldValue, newValue in
            if let newValue = newValue {
                // Toggle: if tapping same date, deselect; otherwise select new date
                if selectedDate == newValue {
                    selectedDate = nil
                } else {
                    selectedDate = newValue
                }
            }
            // Reset raw selection to allow re-tapping
            rawSelectedDate = nil
        }
    }
    
    @ChartContentBuilder
    private func createBarMark(for dataPoint: ChartDataPoint, domain: (min: Double, max: Double), yMidpoint: Double) -> some ChartContent {
        if let start = dataPoint.startOffset, let end = dataPoint.endOffset {
            BarMark(
                x: .value("Day", dataPoint.day, unit: .day),
                yStart: .value("Bedtime", invertY(start, midpoint: yMidpoint)),
                yEnd: .value("Wake Up", invertY(end, midpoint: yMidpoint)),
                width: .fixed(selectedRange.barWidth)
            )
            .foregroundStyle(Color.brandPurple)
            .cornerRadius(selectedRange.cornerRadius)
        } else {
            // Invisible placeholder
            BarMark(
                x: .value("Day", dataPoint.day, unit: .day),
                yStart: .value("Placeholder", domain.min),
                yEnd: .value("Placeholder", domain.min),
                width: .fixed(selectedRange.barWidth)
            )
            .foregroundStyle(.clear)
        }
    }
    
    @ChartContentBuilder
    private func createTargetLines(settings: UserSettings, yMidpoint: Double) -> some ChartContent {
        let bedTarget = normalizeTime(settings.targetBedtime)
        let wakeTarget = normalizeTime(settings.targetWakeTime)
        
        RuleMark(y: .value("Target Bed", invertY(bedTarget, midpoint: yMidpoint)))
            .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
            .foregroundStyle(.green)
            .annotation(position: .trailing, alignment: .leading) {
                Text("Target Bed")
                    .font(.system(size: 9))
                    .foregroundStyle(.green)
                    .padding(.leading, 1)
            }
        
        RuleMark(y: .value("Target Wake", invertY(wakeTarget, midpoint: yMidpoint)))
            .lineStyle(StrokeStyle(lineWidth: 1, dash: [4]))
            .foregroundStyle(.green)
            .annotation(position: .trailing, alignment: .leading) {
                Text("Target Wake")
                    .font(.system(size: 9))
                    .foregroundStyle(.green)
                    .padding(.leading, 1)
            }
    }
    
    // MARK: - Data Preparation
    
    struct ChartDataPoint: Identifiable {
        let id = UUID()
        let day: Date
        let startOffset: Double?
        let endOffset: Double?
    }
    
    private func prepareChartData() -> [ChartDataPoint] {
        (0..<selectedRange.days).compactMap { i in
            guard let dayDate = calendar.date(byAdding: .day, value: i, to: chartStart) else { return nil }
            
            let session = filteredSessions.first { session in
                guard let end = session.endTime else { return false }
                return calendar.startOfDay(for: end) == dayDate
            }
            
            if let session = session, let end = session.endTime {
                return ChartDataPoint(
                    day: dayDate,
                    startOffset: normalizeTime(session.startTime),
                    endOffset: normalizeTime(end)
                )
            } else {
                return ChartDataPoint(day: dayDate, startOffset: nil, endOffset: nil)
            }
        }
    }
    
    private func calculateYDomain(data: [ChartDataPoint]) -> (min: Double, max: Double) {
        var values = data.compactMap { $0.startOffset } + data.compactMap { $0.endOffset }
        
        if let settings = settingsService.settings {
            values.append(normalizeTime(settings.targetBedtime))
            values.append(normalizeTime(settings.targetWakeTime))
        }
        
        guard let dataMin = values.min(), let dataMax = values.max() else {
            return (18, 34) // Default fallback
        }
        
        return (floor(dataMin - 1), ceil(dataMax + 1))
    }
    
    // MARK: - Helper Functions
    
    private func invertY(_ value: Double, midpoint: Double) -> Double {
        2 * midpoint - value
    }
    
    private func normalizeTime(_ date: Date) -> Double {
        let hour = Double(calendar.component(.hour, from: date))
        let minute = Double(calendar.component(.minute, from: date)) / 60.0
        let value = hour + minute
        return value < 15.0 ? value + 24.0 : value
    }
    
    private func normalizeTime(_ timeStr: String) -> Double {
        let parts = timeStr.split(separator: ":").compactMap { Double($0) }
        guard parts.count >= 2 else { return 23.0 }
        
        let value = parts[0] + parts[1] / 60.0
        return value < 15.0 ? value + 24.0 : value
    }
    
    private func formatYLabel(_ value: Double) -> String {
        let normalized = Int(value) % 24
        let isPM = normalized >= 12
        let hour12 = normalized > 12 ? normalized - 12 : (normalized == 0 ? 12 : normalized)
        return "\(hour12) \(isPM ? "PM" : "AM")"
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        return formatter.string(from: date)
    }
    
    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter.string(from: date)
    }
    
    private func formatDuration(from start: Date, to end: Date) -> String {
        let interval = end.timeIntervalSince(start)
        let hours = Int(interval) / 3600
        let minutes = (Int(interval) % 3600) / 60
        return "\(hours)hr \(minutes)min"
    }
}

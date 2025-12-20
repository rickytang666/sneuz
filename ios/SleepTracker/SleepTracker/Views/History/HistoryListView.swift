import SwiftUI

struct HistoryListView: View {
    @StateObject private var sessionService = SleepSessionService.shared
    
    var body: some View {
        List(sessionService.sessions) { session in
            VStack(alignment: .leading, spacing: 5) {
                HStack {
                    Image(systemName: "bed.double.fill")
                        .foregroundColor(.indigo)
                    Text(session.startTime.formatted(date: .abbreviated, time: .omitted))
                        .font(.headline)
                }
                
                HStack {
                    Text("In Bed:")
                    Text(session.startTime.formatted(date: .omitted, time: .shortened))
                    Spacer()
                    if let end = session.endTime {
                        Text("Wake:")
                        Text(end.formatted(date: .omitted, time: .shortened))
                    } else {
                        Text("Active")
                            .foregroundColor(.green)
                            .bold()
                    }
                }
                .font(.subheadline)
                .foregroundColor(.secondary)
            }
            .padding(.vertical, 4)
        }
        .navigationTitle("History")
        .refreshable {
            await sessionService.fetchSessions()
        }
    }
}

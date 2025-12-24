import SwiftUI

struct HistoryListView: View {
    @StateObject private var sessionService = SleepSessionService.shared
    @State private var showingAddSheet = false
    
    var body: some View {
        List {
            ForEach(sessionService.sessions) { session in
                NavigationLink(destination: SleepSessionDetailView(session: session)) {
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
            }
            .onDelete(perform: deleteSession)
        }
        .navigationTitle("History")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button(action: { showingAddSheet = true }) {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showingAddSheet) {
            NavigationStack {
                SleepSessionDetailView()
            }
        }
        .refreshable {
            await sessionService.fetchSessions()
        }
    }
    
    private func deleteSession(at offsets: IndexSet) {
        // We need to delete via ID, so we get the sessions first
        // Be careful with async in list modification, typically swipe to delete expects immediate UI update.
        // But for network, we might want to just fire and forget or show loading.
        // For simplicity, we'll try to execute it.
        
        let sessionsToDelete = offsets.map { sessionService.sessions[$0] }
        
        Task {
            for session in sessionsToDelete {
                do {
                    try await sessionService.deleteSession(id: session.id)
                } catch {
                    print("Error deleting session: \(error)")
                }
            }
        }
    }
}

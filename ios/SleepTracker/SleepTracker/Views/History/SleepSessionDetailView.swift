import SwiftUI

struct SleepSessionDetailView: View {
    @Environment(\.dismiss) var dismiss
    @ObservedObject var sessionService = SleepSessionService.shared
    
    // If nil, we are creating a new session
    var session: SleepSession?
    
    @State private var startTime: Date
    @State private var endTime: Date
    @State private var isLoading = false
    @State private var error: String?
    
    init(session: SleepSession? = nil) {
        self.session = session
        _startTime = State(initialValue: session?.startTime ?? Date())
        _endTime = State(initialValue: session?.endTime ?? Date())
    }
    
    var body: some View {
        Form {
            Section(header: Text("Time")) {
                DatePicker("Start Time", selection: $startTime)
                DatePicker("End Time", selection: $endTime)
            }
            
            if let error = error {
                Section {
                    Text(error)
                        .foregroundColor(.red)
                }
            }
        }
        .navigationTitle(session == nil ? "Add Session" : "Edit Session")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
            }
            
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    saveSession()
                }
                .disabled(isLoading)
            }
        }
    }
    
    private func saveSession() {
        print("🔍 DetailView: saveSession called")
        guard endTime >= startTime else {
            print("🔍 DetailView: Validation failed - End time before start time")
            error = "End time must be after start time"
            return
        }
        
        isLoading = true
        error = nil
        
        Task {
            print("🔍 DetailView: Starting Task")
            do {
                if let session = session {
                    print("🔍 DetailView: Calling updateSession")
                    try await sessionService.updateSession(id: session.id, start: startTime, end: endTime)
                    print("🔍 DetailView: updateSession returned")
                } else {
                    print("🔍 DetailView: Calling createSession")
                    try await sessionService.createSession(start: startTime, end: endTime)
                    print("🔍 DetailView: createSession returned")
                }
                
                print("🔍 DetailView: Attempting dismiss")
                await MainActor.run {
                    dismiss()
                    print("🔍 DetailView: Dismiss called")
                }
            } catch {
                print("🔍 DetailView: Catch block - \(error)")
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
}

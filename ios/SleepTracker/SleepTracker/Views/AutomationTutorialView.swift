import SwiftUI

struct AutomationTutorialView: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Automate Sleep Tracking")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text("Have the app automatically track your sleep when you turn on Sleep Focus.")
                            .font(.body)
                            .foregroundColor(.gray)
                    }
                    .padding(.bottom, 12)
                    
                    // Step 1
                    TutorialStep(
                        number: 1,
                        title: "Open Shortcuts App",
                        description: "Go to the 'Automation' tab at the bottom."
                    )
                    
                    // Step 2
                    TutorialStep(
                        number: 2,
                        title: "Create Automation",
                        description: "Tap '+' and choose 'Sleep' under Personal Automation."
                    )
                    
                    // Step 3
                    TutorialStep(
                        number: 3,
                        title: "Configure Triggers",
                        description: "Select 'When turning on' -> Run Immediately. Add action 'Start Sleep Tracking'. Do the same for 'When turning off' -> 'Stop Sleep Tracking'."
                    )
                    
                    Spacer()
                        .frame(height: 20)
                    
                    // Action Buttons
                    VStack(spacing: 16) {
                        Link(destination: URL(string: "shortcuts://")!) {
                            HStack {
                                Image(systemName: "square.stack.3d.up.fill")
                                Text("Open Shortcuts App")
                            }
                            .fontWeight(.bold)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.indigo)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        
                        Button("I'll do it later") {
                            dismiss()
                        }
                        .foregroundColor(.gray)
                    }
                }
                .padding(24)
            }
            .background(Color(red: 0.1, green: 0.1, blue: 0.12).ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct TutorialStep: View {
    let number: Int
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            ZStack {
                Circle()
                    .fill(Color.indigo.opacity(0.2))
                    .frame(width: 32, height: 32)
                
                Text("\(number)")
                    .fontWeight(.bold)
                    .foregroundColor(.indigo)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.white)
                
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

#Preview {
    AutomationTutorialView()
}

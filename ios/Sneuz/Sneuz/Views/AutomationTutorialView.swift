import SwiftUI

struct AutomationTutorialView: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 32) {
                    
                    // Header
                    VStack(alignment: .center, spacing: 16) {
                        Image(systemName: "bolt.badge.automatic")
                            .font(.system(size: 60))
                            .foregroundStyle(LinearGradient(colors: [.accentColor, .purple], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .padding(.bottom, 8)
                        
                        Text("Automate Your Sleep")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text("Automatically start tracking when you turn on Sleep Focus, or any other focus mode you prefer.")
                            .font(.body)
                            .multilineTextAlignment(.center)
                            .foregroundColor(.gray)
                            .padding(.horizontal)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.bottom, 16)
                    
                    // Step 1
                    TutorialStep(
                        number: 1,
                        title: "Open Shortcuts App",
                        description: "Go to the 'Automation' tab at the bottom of the Shortcuts app."
                    )
                    
                    // Step 2
                    TutorialStep(
                        number: 2,
                        title: "Create Personal Automation",
                        description: "Tap '+' and choose a Trigger. You can use 'Sleep' focus, 'Do Not Disturb', or any other focus mode you prefer."
                    )
                    
                    // Step 3
                    TutorialStep(
                        number: 3,
                        title: "Add Actions",
                        description: "Set 'When Turning On' to 'Start Sleep Tracking'.\nSet 'When Turning Off' to 'Stop Sleep Tracking'."
                    )
                    
                    Spacer()
                        .frame(height: 20)
                    
                    // Action Buttons
                    VStack(spacing: 16) {
                        Link(destination: URL(string: "shortcuts://")!) {
                            HStack {
                                Image(systemName: "square.stack.3d.up.fill")
                                Text("Open Shortcuts & Create")
                            }
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.accentColor)
                            .foregroundColor(.white)
                            .cornerRadius(16)
                            .shadow(color: Color.accentColor.opacity(0.4), radius: 8, x: 0, y: 4)
                        }
                        
                        Button("Maybe Later") {
                            dismiss()
                        }
                        .font(.subheadline)
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
                    .fill(Color.accentColor.opacity(0.2))
                    .frame(width: 32, height: 32)
                
                Text("\(number)")
                    .fontWeight(.bold)
                    .foregroundColor(.accentColor)
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

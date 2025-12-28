import SwiftUI

struct LoginView: View {
    @StateObject private var auth = AuthService.shared
    @State private var email = ""
    @State private var password = ""
    @State private var showingSignup = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text("Sneuz")
                    .font(.largeTitle)
                    .bold()
                
                VStack(spacing: 12) {
                    TextField("Email", text: $email)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                    
                    SecureField("Password", text: $password)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .textContentType(.password)
                }
                .padding(.horizontal)
                
                if let error = auth.errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                
                Button(action: signIn) {
                    if auth.isLoading {
                        ProgressView()
                    } else {
                        Text("Sign In")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.accentColor)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                }
                .disabled(auth.isLoading)
                .padding(.horizontal)
                
                Button("Create Account") {
                    showingSignup = true
                }
                .padding(.top)
            }
            .padding()
            .navigationDestination(isPresented: $showingSignup) {
                SignupView()
            }
        }
    }
    
    private func signIn() {
        Task {
            do {
                try await auth.signIn(email: email, password: password)
            } catch {
                // Error handled in service
            }
        }
    }
}

import SwiftUI

struct SignupView: View {
    @StateObject private var auth = AuthService.shared
    @State private var email = ""
    @State private var password = ""
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Create Account")
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
                    .textContentType(.newPassword)
            }
            .padding(.horizontal)
            
            if let error = auth.errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }
            
            Button(action: signUp) {
                if auth.isLoading {
                    ProgressView()
                } else {
                    Text("Sign Up")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.brandPurple)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
            }
            .disabled(auth.isLoading)
            .padding(.horizontal)
            
            Button(action: signInWithGoogle) {
                HStack {
                    Image("google-logo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 20, height: 20)
                    Text("Sign Up with Google")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.white)
                .foregroundColor(.black)
                .cornerRadius(10)
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.gray.opacity(0.4)))
            }
            .disabled(auth.isLoading)
            .padding(.horizontal)
        }
        .padding()
    }
    
    private func signUp() {
        Task {
            do {
                try await auth.signUp(email: email, password: password)
            } catch {
                // Error handled in service
            }
        }
    }
    
    private func signInWithGoogle() {
        Task {
            do {
                try await auth.signInWithGoogle()
            } catch {
                // Error handled in service
            }
        }
    }
}

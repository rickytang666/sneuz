import Foundation
import Supabase
import Combine

class AuthService: ObservableObject {
    static let shared = AuthService()
    private let client = Supabase.client
    
    @Published var session: Session?
    @Published var user: User?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    init() {
        // Initial session check
        Task {
            await refreshSession()
        }
    }
    
    @MainActor
    func refreshSession() async {
        do {
            self.session = try await client.auth.session
            self.user = try await client.auth.user()
            SharedData.shared.isLoggedIn = true
        } catch {
            print("Session refresh error: \(error)")
            SharedData.shared.isLoggedIn = false
        }
    }
    
    @MainActor
    func signUp(email: String, password: String) async throws {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            let response = try await client.auth.signUp(email: email, password: password)
            self.session = response.session
            self.user = response.user
            SharedData.shared.isLoggedIn = true
        } catch {
            self.errorMessage = error.localizedDescription
            throw error
        }
    }
    
    @MainActor
    func signIn(email: String, password: String) async throws {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            let session = try await client.auth.signIn(email: email, password: password)
            self.session = session
            self.user = session.user
            SharedData.shared.isLoggedIn = true
        } catch {
            self.errorMessage = error.localizedDescription
            throw error
        }
    }
    
    @MainActor
    func signOut() async throws {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            try await client.auth.signOut()
            self.session = nil
            self.user = nil
            SharedData.shared.isLoggedIn = false
        } catch {
            self.errorMessage = error.localizedDescription
            throw error
        }
    }
    
    var isAuthenticated: Bool {
        return session != nil
    }
}

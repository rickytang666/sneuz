import Foundation
import Supabase

struct Supabase {
    static let client = SupabaseClient(
        supabaseURL: Config.supabaseUrl,
        supabaseKey: Config.supabaseAnonKey,
        options: SupabaseClientOptions(
            auth: .init(
                storage: SharedUserDefaultsStorage(),
                emitLocalSessionAsInitialSession: true
            )
        )
    )
}

// MARK: - Shared Storage
// Using App Shared UserDefaults to ensure Widget can access the session.
// Note: For higher security, migrate to Shared Keychain (kSecAttrAccessGroup) in production.
struct SharedUserDefaultsStorage: AuthLocalStorage {
    private var userDefaults: UserDefaults? {
        UserDefaults(suiteName: "group.io.sneuz.shared")
    }
    
    func store(key: String, value: Data) throws {
        userDefaults?.set(value, forKey: key)
    }
    
    func retrieve(key: String) throws -> Data? {
        return userDefaults?.data(forKey: key)
    }
    
    func remove(key: String) throws {
        userDefaults?.removeObject(forKey: key)
    }
}

import Foundation
import Supabase

struct Supabase {
    static let client = SupabaseClient(
        supabaseURL: Config.supabaseUrl,
        supabaseKey: Config.supabaseAnonKey,
        options: SupabaseClientOptions(
            auth: SupabaseClientOptions.AuthOptions(
                storage: KeychainLocalStorage(
                    service: "supabase.auth.token",
                    accessGroup: "io.sleeptracker.shared"
                )
            )
        )
    )
}

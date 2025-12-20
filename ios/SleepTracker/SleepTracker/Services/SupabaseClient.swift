import Foundation
import Supabase

struct Supabase {
    static let client = SupabaseClient(
        supabaseURL: Config.supabaseUrl,
        supabaseKey: Config.supabaseAnonKey
    )
}

<div align="center">

<img src="web/public/logo_rounded.png" alt="Sneuz" width="152">

Apple removed iPhone auto sleep tracking. We brought it back, with extras.

</div>

---

## What it does

iOS 18 removed automatic sleep tracking on iPhone.

Sneuz brings it back with Shortcuts automation: track sleep/wake times, view sleep patterns on iPhone or web, and export data to Apple Health at any time.

Set it up once, runs automatically.

https://github.com/user-attachments/assets/3fc11cd6-3557-4489-a276-d984c3a937e5

https://github.com/user-attachments/assets/71894cbb-5b23-4540-b664-8e7bacce0669

## Features

- **Shortcuts automation**: Hooks into Sleep Focus mode - tracking starts/stops automatically
- **Home screen widget**: Glanceable status and quick actions without opening the app
- **Web calendar view**: Visualize sleep patterns on a proper calendar
- **Apple Health export**: One-click sync to Apple Health

## Tech stack

- **iOS**: Swift, SwiftUI, WidgetKit, HealthKit, App Intents
- **Web**: Next.js, Tailwind, Better Auth, Drizzle ORM
- **Database**: Neon (Postgres)

## iOS app status

Fully built. Can verify and tested out via Xcode & simulator.

It _might_ be shipped on App Store. It still talks to the old Supabase backend, so it no longer syncs with the web app until it is ported to `/api/v1`.

## Dev setup

**Prerequisites**: Node.js, pnpm, a Neon project (free plan), a Google OAuth web client. Xcode for iOS.

**Web**:

```bash
cp web/.env.example web/.env  # fill in DATABASE_URL, BETTER_AUTH_SECRET and the Google client
cd web
pnpm install
pnpm exec drizzle-kit migrate  # creates the tables in your Neon database
pnpm dev
```

Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI on the Google client.

`pnpm validate` runs build, lint, tests, and react-doctor.

**iOS**:

1. Open `ios/Sneuz.xcodeproj`
2. Update `Config.swift` with a Supabase URL + anon key (the iOS app has not moved off Supabase yet, schema in `supabase/migrations`)
3. Set App Group to `group.io.sneuz.shared` in Signing & Capabilities
4. Run on simulator or install on physical device (need to plug in using cable)
5. Enjoy

## How Shortcuts automation works

App Intents framework exposes `StartTrackingIntent` and `StopTrackingIntent` to iOS.

Users create automations tied to Focus modes (Sleep Focus or any other focus modes). When triggered: validates state → writes to Supabase → refreshes widget.

See [this doc](docs/ios-automation.md) for more details. Sleep Focus is weird, and it has special toggle behavior.

Zero background tasks. Just two API calls when Focus toggles - minimal battery impact.

## API

The web app exposes a REST API at `/api/v1` for external services (e.g. home servers, automations).

### Authentication

All endpoints require an API key in the `Authorization` header:

```
Authorization: ApiKey <snz_key>
```

Generate one in the web app under Settings > API Keys.

### Endpoints

#### Sessions

| Method   | Path                   | Description         |
| -------- | ---------------------- | ------------------- |
| `GET`    | `/api/v1/sessions`     | List sleep sessions |
| `POST`   | `/api/v1/sessions`     | Create a session    |
| `PATCH`  | `/api/v1/sessions/:id` | Update a session    |
| `DELETE` | `/api/v1/sessions/:id` | Delete a session    |

**GET** query params: `limit` (default 50, max 200), `offset`, `from` (ISO date), `to` (ISO date)

**POST / PATCH** body:

```json
{ "bedtime": "2026-01-01T23:00:00Z", "wake_time": "2026-01-02T07:00:00Z" }
```

`bedtime` is required on POST. PATCH requires at least one field.

**Session object:**

```json
{
  "id": "uuid",
  "bedtime": "2026-01-01T23:00:00Z",
  "wake_time": "2026-01-02T07:00:00Z",
  "duration_minutes": 480,
  "created_at": "2026-01-01T23:00:00Z"
}
```

#### Profile

| Method | Path              | Description      |
| ------ | ----------------- | ---------------- |
| `GET`  | `/api/v1/profile` | Get user profile |

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Jane",
  "avatar_url": ""
}
```

#### Settings

| Method  | Path               | Description          |
| ------- | ------------------ | -------------------- |
| `GET`   | `/api/v1/settings` | Get sleep targets    |
| `PATCH` | `/api/v1/settings` | Update sleep targets |

**PATCH** body (at least one field required):

```json
{ "target_bedtime": "23:00", "target_wake_time": "07:00" }
```

#### API keys

| Method   | Path               | Description       |
| -------- | ------------------ | ----------------- |
| `GET`    | `/api/v1/keys`     | List API keys     |
| `POST`   | `/api/v1/keys`     | Create an API key |
| `DELETE` | `/api/v1/keys/:id` | Revoke an API key |

**POST** body: `{ "name": "home server" }`

The raw key is only returned once in the POST response. Store it securely.

### Example

```bash
curl https://sneuz.rickytang.dev/api/v1/sessions \
  -H "Authorization: ApiKey snz_your_key_here"
```

## License

MIT

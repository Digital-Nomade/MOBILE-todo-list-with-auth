# Mobile Todo List with Authentication

A cross-platform todo application built with Expo and React Native. It supports
iOS, Android, and static web builds, with a GraphQL backend for authentication,
profiles, and todo management.

## Features

- Account registration with a six-digit email confirmation code.
- Verification-code resend with a local cooldown and safe, generic responses.
- Login with access and rotating refresh tokens.
- Automatic session restoration and one-time request retry after token refresh.
- Forgot-password, reset-password, and authenticated change-password flows.
- Logout from the current session or every active session.
- Route protection for active, pending-verification, and suspended accounts.
- Profile viewing and editing.
- Paginated todo listing, creation, editing, completion, and deletion.
- Offline-first todo CRUD with AsyncStorage persistence and background sync.
- Profile toggle to keep todos 100% local (default off).
- Optional due dates and reminders using ISO-8601 GraphQL values.
- Native and web UI built from reusable components with Storybook coverage.
- Notifications UI scaffolded with local mock data.

## Tech stack

### Application

- Expo `51`
- React Native `0.74.5`
- React `18.2`
- TypeScript `5.9`
- Expo Router `3.5` with typed, file-based routes
- React Native Web `0.19`
- React Navigation
- React Native Gesture Handler, Reanimated, and Moti
- React Hook Form
- date-fns

### Data and state

- Redux Toolkit and RTK Query
- React Redux
- redux-persist with AsyncStorage
- `@react-native-community/netinfo` for connectivity detection
- A custom GraphQL base query built on `fetch`
- Expo SecureStore for native refresh-token storage

### Quality and testing

- Jest with `jest-expo`
- React Native Testing Library
- Storybook `10` for React Native Web with Vite
- Storybook Docs and Accessibility addons
- Maestro for native end-to-end tests
- ESLint with Expo configuration
- Husky pre-commit hooks

## Prerequisites

- Node.js and npm
- The backend GraphQL API running locally on port `3773`
- For iOS: macOS, Xcode, and an iOS Simulator
- For Android: Android Studio, an SDK, and an Android Emulator
- For E2E: the [Maestro CLI](https://maestro.mobile.dev/)

No Node.js version is pinned in this repository. Use a version supported by
Expo SDK 51 and install dependencies from the committed `package-lock.json`.

## Quick start

```bash
git clone <repository-url>
cd MOBILE-todo-list-with-auth
npm install
npm run start
```

The Expo terminal lets you open the project on a simulator, emulator, browser,
or compatible Expo Go client. Platform-specific commands are also available:

```bash
npm run ios
npm run android
npm run web
```

## Backend and environment configuration

All backend operations use HTTP `POST` requests to `/graphql`.

The frontend reads these public environment variables:

```bash
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:3773/graphql
EXPO_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3773/graphql
```

If `EXPO_PUBLIC_GRAPHQL_URL` is not set, `constants/Config.ts` picks a
platform default:

- iOS Simulator and web: `http://localhost:3773/graphql`
- Android Emulator: `http://10.0.2.2:3773/graphql`

If `EXPO_PUBLIC_GRAPHQL_WS_URL` is not set, the WebSocket URL is derived from
the HTTP URL by swapping `http`/`https` for `ws`/`wss`.

For persistent local configuration, create an uncommitted `.env.local`:

```dotenv
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:3773/graphql
EXPO_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3773/graphql
```

Expo public variables are embedded in the client bundle. Do not put secrets,
private keys, credentials, or privileged tokens in `EXPO_PUBLIC_*` variables.

### Platform-specific local URLs

The iOS Simulator and web browser can use the default localhost URL:

```bash
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:3773/graphql npm run ios
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:3773/graphql npm run web
```

The standard Android Emulator reaches the host machine through `10.0.2.2`.
When unset, `constants/Config.ts` already defaults to that host on Android:

```bash
EXPO_PUBLIC_GRAPHQL_URL=http://10.0.2.2:3773/graphql npm run android
EXPO_PUBLIC_GRAPHQL_WS_URL=ws://10.0.2.2:3773/graphql npm run android
```

For a physical device, use the development machine's LAN address and ensure
the backend accepts connections from that interface:

```bash
EXPO_PUBLIC_GRAPHQL_URL=http://192.168.1.10:3773/graphql npm run start
```

Set the production or staging GraphQL URL explicitly when creating a build.
There are no production or staging URLs hardcoded in this repository.

## Authentication lifecycle

Authentication is implemented in `features/auth/` and the shared RTK Query
transport in `config/redux/`.

- Login returns an access token, refresh token, expiry, and user snapshot.
- The access token remains in memory.
- Native refresh tokens use Keychain/Keystore through Expo SecureStore.
- Web refresh tokens currently fall back to `localStorage`.
- Auth state and RTK Query cache are excluded from AsyncStorage persistence.
- Startup restores a session by exchanging the stored refresh token.
- Protected GraphQL operations attach `Authorization: Bearer <accessToken>`.
- An `UNAUTHENTICATED` protected request triggers one single-flight refresh.
- Concurrent failures share that refresh, then retry exactly once.
- Failed refreshes clear the local session and route back to login.
- Anonymous operations never trigger refresh recursion.

GraphQL errors are normalized using `errors[].extensions.code`, including
responses with HTTP status `200`.

### Email confirmation

Registration returns a generic server message and does not authenticate the
user. The confirmation screen:

- keeps only the normalized email, generic message, and resend cooldown in
  short-lived flow state;
- accepts exactly six numeric characters and preserves leading zeroes;
- submits `{ email, code }` to `VerifyEmail`;
- never stores the confirmation code in a URL or persistent state;
- supports resend and explains that the previous code is invalidated;
- returns successfully verified users to login.

On web, non-sensitive verification flow metadata uses `sessionStorage`. On
native, it remains in memory. The confirmation code itself is never stored.

### Route guards

- Unauthenticated users are redirected to `/(auth)`.
- Active authenticated users are redirected away from auth screens to
  `/(home)`.
- Pending-verification users are sent to `/(auth)/check-email`.
- Suspended users are sent to `/(auth)/account-unavailable`.

The app's deep-link scheme is `myapp`. Password reset links target
`myapp://reset-password`; email confirmation codes are entered manually and
must not be placed in links.

## GraphQL modules

GraphQL documents and TypeScript models are maintained manually; this project
does not currently use a GraphQL code generator.

- `features/auth/`: registration, confirmation, login, token refresh, logout,
  logout-all, and password recovery.
- `features/user/`: current profile, editable profile fields, and password
  changes.
- `features/todos/`: paginated queries and todo CRUD.
- `config/graphql/`: transport and normalized GraphQL error handling.
- `config/redux/api.ts`: shared RTK Query API and refresh/retry orchestration.

Todo IDs are UUID strings. Todo date/time fields cross the GraphQL boundary as
ISO-8601 strings.

## Offline-first todos and local-only mode

Todo CRUD is routed through `features/todos/offline/todoService.ts`, which
decides whether to read/write locally or call GraphQL based on connectivity and
the user's profile preference.

### Default cloud mode

- When online, todos are fetched from GraphQL and mirrored into user-scoped
  AsyncStorage.
- When offline or when a transport failure occurs (`NETWORK_ERROR`), writes are
  applied locally immediately and queued for later upload.
- Sync runs in the background (non-blocking) on reconnect, app startup, and
  foreground entry. It does not use OS background tasks.
- Authenticated `todoChanged` subscriptions trigger a full reconciliation.
  Reconnects also refetch because subscription events are not replayed.
- Queued creates send a stable `Idempotency-Key` header; the backend must honor
  it to prevent duplicate todos on retry.

### Local-only mode (profile toggle, default off)

- Enabling requires destructive confirmation, prepares a server snapshot,
  verifies its SHA-256 checksum, stores it durably, and only then commits the
  permanent deletion of those server rows.
- Interrupted commits retain their migration ID and retry idempotently on
  startup or reconnect. A failed local save cancels without deleting server data.
- While enabled, all todo CRUD stays on the device.
- Disabling prompts for confirmation and recreates the current local todos on
  the server in the background.

### Storage and privacy

- Offline data is keyed by authenticated user id under `offline.todos.v1:*`.
- Auth tokens and RTK Query cache are never written to AsyncStorage.
- Reactive offline UI state lives in the non-persisted `offlineTodos` Redux
  slice; AsyncStorage remains the durable source of truth.
- Local todo data is stored unencrypted in AsyncStorage. Clear app storage when
  switching test users or backend databases.

### Conflict behavior

There is no server version token. Upload replay uses ordered client operations
and last local write wins. This is not conflict-free synchronization.

See also:

- [docs/offline-todo-sync-execution.md](docs/offline-todo-sync-execution.md) — cross-platform execution checklist
- [docs/offline-todo-sync-web.md](docs/offline-todo-sync-web.md) — web browser storage, sync triggers, QA, and troubleshooting

## Project structure

```text
app/                     Expo Router screens and route layouts
  (auth)/                Login, signup, verification, and password recovery
  (home)/                Protected tabs, profile, dashboard, and todo screens
components/
  atoms/                 Inputs, buttons, checkbox, date picker, and skeletons
  features/              Todo and notification feature components
  icons/                 SVG icon components
  navigation/            Navigation-specific components
  organisms/             Todo form and tab bar
  templates/             Shared application wrapper
config/
  graphql/               GraphQL transport and error normalization
  redux/                 Store, RTK Query base API, hooks, and reauthentication
constants/               Runtime configuration and style guide
features/
  auth/                  Authentication API, state, storage, types, documents
  todos/                 Todo API and GraphQL documents
  user/                  Profile API, types, and GraphQL documents
hooks/                   Session and reusable application hooks
tests/                   Screen and navigation tests
test-utils/              Jest setup, stores, fixtures, and GraphQL helpers
.storybook/              Storybook config, browser mocks, and fixtures
.maestro/                Native E2E configuration, flows, scripts, and docs
scripts/                 Repository utility scripts
types/                   Shared domain models
```

The `@/` TypeScript alias points to the repository root.

## Commands

### Development

- `npm run start` — start the Expo development server.
- `npm run ios` — start Expo and open the iOS Simulator.
- `npm run android` — start Expo and open the Android Emulator.
- `npm run web` — start the web application through Metro.

### Static analysis and unit tests

- `npm run lint` — run ESLint through Expo.
- `npm run typecheck` — run TypeScript without emitting files.
- `npm test` — run Jest in watch mode.
- `npm run test:ci` — run the Jest suite once.
- `npm run verify` — run lint, typecheck, Jest serially, Storybook coverage,
  and the static Storybook build.

### Storybook

- `npm run storybook` — start Storybook Web on port `6006`.
- `npm run storybook:check` — require a co-located story for each of the 18
  tracked components.
- `npm run storybook:build` — build the static catalog into
  `storybook-static/`.

Storybook replaces app-only router, todo API, and native date-picker
dependencies with browser mocks from `.storybook/mocks/`. Stories must not call
the real backend.

### End-to-end tests

- `npm run e2e` — run backend-independent Maestro smoke flows.
- `npm run e2e:backend` — run flows tagged `requires-backend`.
- `npm run e2e:all` — run every Maestro flow.
- `npm run e2e:studio` — open Maestro Studio.
- `npm run e2e:build:ios` — create and install the native iOS app.
- `npm run e2e:build:android` — create and install the native Android app.

See [`.maestro/README.md`](.maestro/README.md) for installation, credentials,
tags, emulator networking, selectors, and debugging.

### Utility

- `npm run prepare` — install Husky hooks; npm runs this after installation.
- `npm run reset-project` — move the current `app/` directory to
  `app-example/` and replace it with a blank Expo Router app.

> `reset-project` is destructive to the current application structure and is
> retained from the Expo starter template. Do not run it during normal
> development.

## Testing

### Jest and React Native Testing Library

Tests cover:

- GraphQL transport and HTTP-200 GraphQL errors;
- token rotation, single-flight refresh, and retry limits;
- authentication, user, and todo RTK Query endpoints;
- login, registration, confirmation-code, password, and profile screens;
- protected-route behavior.

Run the complete suite:

```bash
npm run test:ci -- --runInBand
```

### Storybook

Every tracked reusable component has a co-located `*.stories.tsx` file.
Storybook includes controls, interaction actions, Docs, accessibility checks,
and browser-only fixtures for composite components.

```bash
npm run storybook
npm run storybook:check
npm run storybook:build
```

### Maestro

Maestro runs against a standalone app with identifier
`com.digitalnomade.todo`; it does not run against Expo Go.

```bash
# iOS
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:3773/graphql npm run e2e:build:ios

# Android
EXPO_PUBLIC_GRAPHQL_URL=http://10.0.2.2:3773/graphql npm run e2e:build:android

# Backend-independent flows
npm run e2e
```

Backend-dependent flows require the backend and a verified test account:

```bash
export E2E_IDENTIFIER='e2e-user@example.com'
export E2E_PASSWORD='replace-me'
export E2E_EMAIL='e2e-user@example.com'

npm run e2e:backend -- \
  -e TEST_IDENTIFIER="$E2E_IDENTIFIER" \
  -e TEST_PASSWORD="$E2E_PASSWORD" \
  -e TEST_EMAIL="$E2E_EMAIL"
```

Do not commit E2E credentials. Test artifacts are written to
`.maestro/artifacts/`.

## Builds

Create a static web production export:

```bash
EXPO_PUBLIC_GRAPHQL_URL=https://api.example.com/graphql \
  npx expo export --platform web
```

The output is written to `dist/`.

Native local builds use Expo's native run commands:

```bash
npm run e2e:build:ios
npm run e2e:build:android
```

No EAS Build configuration or CI workflow is currently committed. Add and
review environment-specific build configuration before publishing a release.

## Pre-commit checks

Husky runs `npm run verify` before each commit. A commit is blocked when lint,
typechecking, Jest, Storybook story coverage, or the Storybook static build
fails.

Maestro is intentionally excluded from pre-commit because it requires a
standalone native build and simulator or emulator.

## Security notes

- Never commit passwords, E2E credentials, access tokens, or refresh tokens.
- Never put confirmation codes in URLs, logs, analytics, Redux persistence, or
  device storage.
- Keep production and staging API URLs in build-time environment
  configuration.
- `EXPO_PUBLIC_*` values are public and readable from the application bundle.
- Profile updates intentionally exclude immutable email and username fields.
- A successful password change revokes sessions and clears the local session.

## Current limitations

- Notifications currently use local mock data and are not connected to
  GraphQL.
- Dashboard text search currently shows UI feedback but does not query the
  backend.
- Web refresh-token persistence uses `localStorage` because the backend does
  not currently issue an HTTP-only cookie.
- There is no committed CI workflow or EAS configuration.
- No repository license file is currently included.

## Troubleshooting

### The app cannot reach GraphQL

1. Confirm the backend is running on port `3773`.
2. Confirm the URL ends with `/graphql`.
3. On Android Emulator, use `10.0.2.2`, not `localhost`.
4. On a physical device, use the host machine's LAN IP.
5. Rebuild or restart Expo after changing `EXPO_PUBLIC_GRAPHQL_URL`.

### Authentication immediately returns to login

- Check that the refresh token is valid.
- Clear application storage when switching backend databases or test users.
- Confirm the backend returns `extensions.code` values expected by the client.

### A pending account cannot access the todo screens

This is intentional. Enter the six-digit code on the confirmation screen or
request a new code. Only `ACTIVE` users may enter protected routes.

### Offline changes are not uploading

- Confirm local-only mode is disabled on the profile screen.
- Confirm the device is online (`NetInfo` must report connectivity).
- Bring the app to the foreground; sync runs on reconnect, startup, and resume.
- Check for failed items in the sync status banner.
- Clear offline storage if switching accounts: remove AsyncStorage keys prefixed
  with `offline.todos.v1:`.

### Maestro cannot find the app

Build and install the standalone application first. The expected package and
bundle identifier is `com.digitalnomade.todo`; Expo Go uses a different
identifier.

### Storybook renders native-only dependencies incorrectly

Add or update a browser mock under `.storybook/mocks/`, then alias it from
`.storybook/main.ts`. Do not change production components solely to satisfy
Storybook Web.

## Additional references

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router documentation](https://docs.expo.dev/router/introduction/)
- [Redux Toolkit Query documentation](https://redux-toolkit.js.org/rtk-query/overview)
- [Storybook documentation](https://storybook.js.org/docs)
- [Maestro documentation](https://maestro.mobile.dev/)
- [Detailed Maestro setup](.maestro/README.md)

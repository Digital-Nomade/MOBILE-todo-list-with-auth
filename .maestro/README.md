# Maestro end-to-end tests

The flows test a standalone Expo build with this application identifier on
both platforms:

```text
com.digitalnomade.todo
```

Maestro operates through the native accessibility tree. The application
therefore exposes stable `testID` values for actions and fields; flows should
prefer those IDs over visible text.

## Prerequisites

1. Install the Maestro CLI:

   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   maestro --version
   ```

2. Start an iOS Simulator or Android Emulator.
3. Build and install this app, not Expo Go. Expo Go owns a different app ID and
   cannot be launched using `com.digitalnomade.todo`.

### iOS Simulator

```bash
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:3000/graphql npm run e2e:build:ios
```

### Android Emulator

Android's emulator reaches the host through `10.0.2.2`:

```bash
EXPO_PUBLIC_GRAPHQL_URL=http://10.0.2.2:3000/graphql npm run e2e:build:android
```

Keep Metro running after the build command.

## Suites

### Deterministic smoke tests

These flows clear application state and do not require backend fixtures:

```bash
npm run e2e
```

They cover:

- login validation;
- registration validation;
- missing-token reset-password and email-verification deep links.

### Backend-dependent tests

Start the backend on port 3000 and provide an active, verified test account.
Do not commit credentials to this repository or place them in flow files.

```bash
export E2E_IDENTIFIER='e2e-user@example.com'
export E2E_PASSWORD='replace-me'
export E2E_EMAIL='e2e-user@example.com'

maestro test \
  --config=.maestro/config.yaml \
  --include-tags=requires-backend \
  -e TEST_IDENTIFIER="$E2E_IDENTIFIER" \
  -e TEST_PASSWORD="$E2E_PASSWORD" \
  -e TEST_EMAIL="$E2E_EMAIL" \
  .maestro
```

The authenticated flow creates a uniquely named todo, verifies it, deletes it,
then logs out. The password-reset flow only requests a reset message and does
not consume or change a password.

## Interactive authoring

```bash
npm run e2e:studio
```

Use the IDs already present in the accessibility tree. Add a new `testID` when
an action has no stable selector instead of depending on coordinates.

## Debugging

- Results, screenshots, and diagnostics are written to `.maestro/artifacts/`
  and are git-ignored.
- If `launchApp` cannot find the app, confirm a standalone build with the
  `com.digitalnomade.todo` identifier is installed.
- If Android cannot reach GraphQL, rebuild using the `10.0.2.2` URL above.
- If an authenticated flow lands on verification guidance, use an `ACTIVE`
  account with a verified email.
- Use `maestro hierarchy` to inspect the current accessibility tree.

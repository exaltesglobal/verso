# Code signing

Verso's installers build and run unsigned (see "Unsigned builds" in [RELEASE.md](RELEASE.md)), but users see
SmartScreen and Gatekeeper warnings until the builds are signed. This page lists what to buy and which
GitHub settings the build workflow (`.github/workflows/build.yml`) reads.

## What to buy

| For                       | What                                                                                                         | Notes                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows                   | A code-signing certificate: **OV** (organization validated) or **EV** (extended validation), issued to Exaltes Global Private Limited | Since 2023 the private key must live on a hardware token or cloud HSM. For CI, prefer a cloud option (Azure Trusted Signing, SSL.com eSigner, DigiCert KeyLocker). EV no longer skips SmartScreen reputation building, so OV is usually enough. |
| macOS                     | **Apple Developer Program** membership (organization, needs a D-U-N-S number)                                | Gives the **Developer ID Application** certificate and notarization. Yearly fee.                                                                         |
| Auto-updates (no purchase) | A Tauri updater key pair                                                                                    | `pnpm tauri signer generate -w ~/.tauri/verso.key`. See RELEASE.md step 1.                                                                                |

## Repo secrets and variables the workflow reads

Set them in GitHub: repo Settings > Secrets and variables > Actions. Every one is optional; a missing value
just skips that step.

### Secrets

| Name                                 | Used for                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `APPLE_CERTIFICATE`                  | Developer ID Application certificate exported as `.p12`, base64 encoded |
| `APPLE_CERTIFICATE_PASSWORD`         | Password of that `.p12`                                                  |
| `APPLE_SIGNING_IDENTITY`             | e.g. `Developer ID Application: Exaltes Global Private Limited (TEAMID)`. Unset means ad-hoc signing (`-`). |
| `APPLE_ID`                           | Apple ID email used for notarization                                     |
| `APPLE_PASSWORD`                     | App-specific password for that Apple ID (appleid.apple.com)              |
| `APPLE_TEAM_ID`                      | 10-character team id                                                     |
| `WINDOWS_CERTIFICATE`                | `.pfx` file, base64 encoded (only for a file-based certificate; uncomment the "Import Windows certificate" step) |
| `WINDOWS_CERTIFICATE_PASSWORD`       | Password of that `.pfx`                                                  |
| `TAURI_SIGNING_PRIVATE_KEY`          | Updater private key (file contents)                                      |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Its password                                                             |

### Variables

| Name                           | Used for                                                     |
| ------------------------------ | ------------------------------------------------------------ |
| `TAURI_UPDATER_PUBKEY`         | Updater public key; turns on updater artifacts (`latest.json`) |
| `VERSO_UPDATE_ENDPOINT`        | Update URL baked into the app                                |
| `VERSO_ENTITLEMENT_PUBLIC_KEY` | Offline Pro check                                            |
| `VITE_VERSO_API_URL`           | Accounts API URL                                             |
| `VITE_VERSO_BETA_GATE`         | `true` to ask for an invite code                             |

## Turning on Windows signing

- **File certificate (.pfx)**: add the two `WINDOWS_CERTIFICATE*` secrets, uncomment the import step in
  `build.yml`, and set `bundle.windows.certificateThumbprint` and `bundle.windows.timestampUrl`
  (e.g. `http://timestamp.digicert.com`) in `src-tauri/tauri.conf.json`.
- **Cloud HSM / token**: set `bundle.windows.signCommand` to the vendor's signing tool instead (Tauri Windows
  signing guide), plus the vendor's credentials as secrets.

## Turning on Mac signing and notarization

Add the six `APPLE_*` secrets. The next tag build signs with the Developer ID and notarizes; the Gatekeeper
warning goes away and the "right-click > Open" note can be dropped from the release notes in `build.yml`.

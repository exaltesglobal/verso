# Releasing Verso

How to build signed installers, ship auto-updates and cut a release. Server keys and deploy are in
[SETUP-KEYS.md](SETUP-KEYS.md).

## What ships

| Platform                     | Installers                                  | Notes                                                   |
| ---------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| Windows x64                  | NSIS `.exe` (per-user, no admin) and `.msi` | English only. Icons from `src-tauri/icons`.             |
| macOS (Apple silicon, Intel) | `.dmg` per architecture                     | macOS 13.4+ (ONNX Runtime). Needs notarization to open without warnings. |

Bundle settings live in `src-tauri/tauri.conf.json` (`bundle.windows.nsis`, `bundle.windows.wix`, `bundle.macOS`).

## One-time setup

### 1. Updater signing keys

Tauri checks every update against a public key baked into the app. Generate the pair once and keep the
private key safe: if you lose it, installed copies can't auto-update any more.

```bash
pnpm tauri signer generate -w ~/.tauri/verso.key
```

It asks for a password and writes `~/.tauri/verso.key` (private) and `~/.tauri/verso.key.pub` (public).

- **Public key**: the contents of `verso.key.pub`. Either paste it into `plugins.updater.pubkey` in
  `src-tauri/tauri.conf.json`, or set it as the GitHub variable `TAURI_UPDATER_PUBKEY` (CI writes it into the
  build). While it's empty, in-app updates are off and Settings says "Updates aren't set up for this build yet."
- **Private key**: GitHub secret `TAURI_SIGNING_PRIVATE_KEY` (the file contents) and
  `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. Never commit it.

### 2. Update endpoint

The app asks `plugins.updater.endpoints` for updates. The default is a placeholder:
`https://api.example.com/updates/{{target}}/{{arch}}/{{current_version}}`. Change it in `tauri.conf.json` or set
the GitHub variable `VERSO_UPDATE_ENDPOINT`. Two options:

- **Your server** (recommended): `https://<your-api-domain>/updates/{{target}}/{{arch}}/{{current_version}}`. The
  server reads the release's `latest.json` from `UPDATES_MANIFEST` (default `server/updates/latest.json`) and
  answers 204 when there's nothing newer. To roll out a release, download `latest.json` from the GitHub release
  and copy it there. To pause a rollout, delete the file.
- **GitHub releases** (no server step): `https://github.com/<owner>/<repo>/releases/latest/download/latest.json`.
  Works only if the repo (or its releases) is public.

### 3. Entitlement public key (offline Pro)

Release builds only honour Pro while offline if the entitlement public key is pinned at build time:

```bash
curl https://<your-api-domain>/.well-known/jwks.json   # copy keys[0].x
```

Set it as the GitHub variable `VERSO_ENTITLEMENT_PUBLIC_KEY` (or export it in the shell before a local
`pnpm tauri build`). Debug builds fetch it from the server when it isn't set. Rotating the server key pair means
shipping an app update with the new value first.

### 4. App config

GitHub variables baked into the frontend (see the root `.env.example`):

- `VITE_VERSO_API_URL`: e.g. `https://api.verso.app`. Empty ships the app without accounts (offline, Free plan).
- `VITE_VERSO_BETA_GATE`: `true` to ask for an invite code on first launch. Make codes with
  `pnpm invite:create 50 1 "July testers"` in `server/`.

### 5. Windows code signing (placeholder)

Unsigned installers work but show a SmartScreen warning. When you have a code-signing certificate:

1. Export it as a `.pfx`, base64 it (`[Convert]::ToBase64String([IO.File]::ReadAllBytes("cert.pfx"))`) and add
   secrets `WINDOWS_CERTIFICATE` and `WINDOWS_CERTIFICATE_PASSWORD`.
2. Uncomment the "Import Windows certificate" step in `.github/workflows/build.yml`.
3. Set `bundle.windows.certificateThumbprint` (the certificate's SHA-1 thumbprint) and
   `bundle.windows.timestampUrl` (e.g. `http://timestamp.digicert.com`) in `tauri.conf.json`.

EV certificates on a hardware token or cloud HSM (Azure Trusted Signing, SSL.com eSigner) need
`bundle.windows.signCommand` instead; see the Tauri Windows signing guide.

### 6. Apple signing and notarization (placeholder)

Add these GitHub secrets. The workflow passes them to the build only when they're set.

| Secret                       | What it is                                                               |
| ---------------------------- | ------------------------------------------------------------------------ |
| `APPLE_CERTIFICATE`          | Developer ID Application certificate exported as `.p12`, base64 encoded  |
| `APPLE_CERTIFICATE_PASSWORD` | Password of that `.p12`                                                  |
| `APPLE_SIGNING_IDENTITY`     | e.g. `Developer ID Application: Exaltes Global Private Limited (TEAMID)` |
| `APPLE_ID`                   | Apple ID email used for notarization                                     |
| `APPLE_PASSWORD`             | App-specific password for that Apple ID (appleid.apple.com)              |
| `APPLE_TEAM_ID`              | 10-character team id                                                     |

### 7. FFmpeg on macOS

CI builds FFmpeg itself with `scripts/build-ffmpeg-macos.sh` on each Mac runner (arm64 on `macos-15`, Intel on
`macos-15-intel`): FFmpeg 7.1.1, LGPL only (`--disable-gpl --disable-nonfree`), VideoToolbox, libass, libvpx,
libopus, freetype/harfbuzz/fribidi, all linked statically so the binaries need nothing but macOS itself. The
script fails if the result is GPL or links a non-system library. The output is cached per architecture until
the script changes (first build about 15 minutes). The source URL and configure line go into
`FFMPEG-LICENSE.txt`, which ships inside the app. To build locally on a Mac:
`brew install pkg-config nasm meson ninja && scripts/build-ffmpeg-macos.sh out/`.

### 8. Unsigned builds

Until the signing secrets exist ([SIGNING.md](SIGNING.md)), installers are unsigned:

- **Windows**: SmartScreen shows "Windows protected your PC". Click **More info** then **Run anyway**.
- **Mac**: the app is ad-hoc signed so it runs on Apple silicon, but Gatekeeper blocks the first launch. Right-click
  Verso in Applications and choose **Open** (macOS 15: System Settings > Privacy & Security > **Open Anyway**),
  or run `xattr -d com.apple.quarantine /Applications/Verso.app`.

### Test builds without a release

Actions > "Build and release" > **Run workflow** on `main`. Installers appear as run artifacts
(`verso-aarch64-apple-darwin`, `verso-x86_64-apple-darwin`, `verso-x86_64-pc-windows-msvc`); no release is made.

## GitHub settings summary

| Kind                | Name                                                                            |
| ------------------- | ------------------------------------------------------------------------------- |
| Secret              | `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`               |
| Secret (optional)   | `APPLE_*` (above), `WINDOWS_CERTIFICATE`, `WINDOWS_CERTIFICATE_PASSWORD`        |
| Variable            | `TAURI_UPDATER_PUBKEY`, `VERSO_UPDATE_ENDPOINT`, `VERSO_ENTITLEMENT_PUBLIC_KEY` |
| Variable            | `VITE_VERSO_API_URL`, `VITE_VERSO_BETA_GATE`                                    |

## Release checklist

1. **Main is green**: CI (`.github/workflows/ci.yml`) passes: typecheck, lint, `cargo check`, server typecheck.
2. **Bump the version** in all three places (they must match):
   - `package.json` → `version`
   - `src-tauri/Cargo.toml` → `version`
   - `src-tauri/tauri.conf.json` → `version`
3. **Server first** if the release needs new endpoints: deploy, run `node dist/migrate.js`, check `/healthz`.
4. **Local smoke build** (Windows):
   ```bash
   pnpm install
   pnpm fetch:ffmpeg            # LGPL sidecars into src-tauri/binaries/
   pnpm build:app               # installers in src-tauri/target/release/bundle/{nsis,msi}
   ```
   To also produce updater artifacts locally, set `TAURI_SIGNING_PRIVATE_KEY` (and `_PASSWORD`) and add
   `--config "{\"bundle\":{\"createUpdaterArtifacts\":true}}"`.
   Install it, sign in, export a clip, open Settings > About and check the FFmpeg notice.
5. **Commit and tag**:
   ```bash
   git commit -am "Release v0.2.0"
   git tag v0.2.0
   git push origin main v0.2.0
   ```
6. **CI builds** Windows and both Mac architectures and publishes the GitHub release with the installers,
   `SHA256SUMS.txt`, and (when the updater key is set) `.sig` files and `latest.json`. A tag with a hyphen
   (`v0.2.0-beta.1`) becomes a pre-release.
7. **Check the release**: install on a clean machine and edit the release notes.
8. **Roll out the update**: copy the release's `latest.json` to the server's `UPDATES_MANIFEST` (skip if you use
   the GitHub endpoint). Running copies show "A new version of Verso is ready. Restart to update." within a few
   seconds of their next launch, or from Settings > Updates > Check now.

## Logs and crash reports

- Logs: `<app log dir>/Verso.log`, rotated at 5 MB (Windows: `%LOCALAPPDATA%\com.agapelabs.verso\logs`,
  macOS: `~/Library/Logs/com.agapelabs.verso`).
- Crash reports: `<app log dir>/crashes/*.json` (app version, OS, stack; the home folder is replaced with `~`).
  On the next launch Verso asks before sending them to `POST /v1/crash-reports`. They land in the
  `crash_reports` table on the server.

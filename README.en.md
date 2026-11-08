# DSH Java Mobile

[中文](./README.md) | English

> **TL;DR** · Multi-platform shell for DSH Java: Android/iOS (Tauri 2 Mobile), HarmonyOS (ArkWeb) and WeChat mini-program (Taro) share one React H5 artifact.
> **Keywords**: Android, iOS, HarmonyOS, ArkWeb, Tauri, WeChat Mini Program, Taro
> **Repositories**: [dsh-java](https://github.com/linlannet/dsh-java) · [dsh-java-plugins](https://github.com/linlannet/dsh-java-plugins) · [dsh-java-desktop](https://github.com/linlannet/dsh-java-desktop) · [dsh-java-release](https://github.com/linlannet/dsh-java-release)
> **For AI**: [llms.txt](./llms.txt) · [AGENTS.md](./AGENTS.md)

DSH multi-platform **shell project**: Android / iOS / HarmonyOS / WeChat mini-program share the **same React H5 artifact**.

> The UI source of truth is `../dsh-java-desktop`. This repository **ships no React business source** — only shells, native bridges, build scripts and artifact consumption.
> Specs and task plans: `docs/specs/mobile_app_evolution/`.

## Platform matrix

| Platform | Shell | Artifact |
| --- | --- | --- |
| Android | Tauri 2 Mobile (Rust + Kotlin plugins) | APK / AAB, embeds `h5-dist` |
| iOS | Tauri 2 Mobile (Rust + Swift plugins) | IPA, embeds `h5-dist` |
| HarmonyOS | ArkTS/ArkUI + ArkWeb `Web` | HAP, embeds `rawfile/h5` |
| WeChat mini-program | Taro 4 + React (reuses the protocol SDK) | mini-program bundle, `miniapp/dist` |

## Layout

```text
dsh-java-mobile/
├── README.md / README.en.md   Chinese / English docs
├── llms.txt                   LLM project summary
├── AGENTS.md                  coding-agent conventions
├── package.json               scripts and metadata
├── docs/specs/                spec, tasks, acceptance, cleanup records
├── h5-dist/                   injected H5 artifact (CI download, not committed)
├── scripts/                   artifact checks, distribution, metadata, regression
├── src-tauri/                 shared Rust shell for Android/iOS (Tauri 2)
├── harmony/                   HarmonyOS ArkTS shell (ArkWeb)
└── miniapp/                   WeChat mini-program (Taro 4 + React)
```

## Build order

1. Run `npm run build` in `../dsh-java-desktop` (the only front-end build).
2. `node scripts/distribute_h5.mjs ../dsh-java-desktop/dist` distributes to `h5-dist/` and HarmonyOS `rawfile/h5/`.
3. Android: `npm run android:build` (first run `npm run android:init`).
4. iOS: `npm run ios:build` (first run `npm run ios:init`).
5. HarmonyOS: DevEco / `hvigorw assembleHap`.
6. Mini-program: `cd miniapp && npm install && npm run build:weapp`.

## One-command regression

```bash
node scripts/desktop_regression.mjs ../dsh-java-desktop .
```

Runs: desktop build, unit tests, platform boundary, artifact metadata, absolute paths, size, security, offline check, H5 smoke, host distribution, cross-repo consistency. Aborts on the first failure.

## Scripts

| Script | Purpose |
| --- | --- |
| `gen_artifact_meta.mjs` | Generate `artifact_meta.json` (content_hash, commit, time, contract version) |
| `check_h5_artifact.mjs` | Reject absolute paths, `file://`, local user paths, leftover sourcemaps |
| `check_h5_size.mjs` | Size gate (first screen ≤1MB, full ≤4MB, gzip) |
| `check_h5_security.mjs` | Block remote scripts / dynamic imports / hot updates; warn on `new Function` |
| `h5_offline_check.mjs` | No external CDN references in HTML/CSS |
| `distribute_h5.mjs` | One build, multi-host distribution with hash verification |
| `verify_hosted_hash.mjs` | Full file-hash comparison between embedded and hosted artifacts |
| `gen_manifest_doc.mjs` | Generate `artifact_manifest.md` |
| `check_release_consistency.mjs` | H5 artifact + desktop embedded JAR + release dist hash consistency |
| `verify_artifact_consistency.mjs` | Unpack APK/AAB/IPA/HAP and compare `artifact_meta.json` |
| `desktop_regression.mjs` | Full desktop regression (11 steps) |

## Status

- Done: single H5 artifact, transport/connection abstraction, device pairing (short code) and mobile access toggle, three shell skeletons, mini-program skeleton, artifact pipeline, one-command desktop regression.
- Blocked: Android SDK (5.x), full Xcode (7.x), DevEco + HarmonyOS device (6.x), 9.x selection (SSH / Relay / scanner), WeChat appid/secret (12.2), CI/acceptance after three-platform builds (10.5–10.7, 11.x).

## Constraints

- Never add a second React entry in this repository, never fork the UI.
- Shells must not carry business rules; business logic flows through the platform adapter and H5.
- Legacy KMP/Kuikly assets have been removed and no longer participate in builds.

## License

MIT
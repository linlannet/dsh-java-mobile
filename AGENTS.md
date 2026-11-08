# AGENTS.md — dsh-java-mobile

## Project
Multi-platform shell for DSH Java: Android/iOS (Tauri 2 Mobile), HarmonyOS (ArkWeb), WeChat mini-program (Taro). Version 0.1.0.

> UI source of truth is `../dsh-java-desktop`. This repo carries **no React business source**.

## Layout
- `src-tauri/` shared Tauri shell
- `harmony/` ArkTS/ArkUI shell + `entry/src/main/ets/bridge/DshBridge.ets`
- `miniapp/` Taro 4 + React mini-program
- `scripts/` build, gate, regression and consistency scripts
- `docs/specs/mobile_app_evolution/` spec, tasks, acceptance
- `h5-dist/` injected H5 artifact (not committed)

## Build & Test
- Full desktop regression: `node scripts/desktop_regression.mjs ../dsh-java-desktop .`
- Distribute artifact: `node scripts/distribute_h5.mjs ../dsh-java-desktop/dist`
- Cross-repo hash check: `node scripts/check_release_consistency.mjs ..`
- Android: `npm run android:build` (first `npm run android:init`)
- iOS: `npm run ios:build` (first `npm run ios:init`)
- Mini program: `cd miniapp && npm install && npm run build:weapp`

## Conventions
- One H5 build, many hosts; never add a second React entry here
- Shells must not contain business rules; use the platform capability contract
- HarmonyOS bridge methods must be in the `DshBridge` whitelist and documented
- Artifact hash must match across `h5-dist/`, `harmony/.../rawfile/h5/`, desktop embedded JAR and release

## Do Not
- Do not edit `h5-dist/`, `dist/`, `node_modules/`
- Do not commit keystores, signing profiles or credentials
- Do not enable remote scripts or hot updates

## Key Docs
- `README.md`
- `docs/specs/mobile_app_evolution/`
- `llms.txt`
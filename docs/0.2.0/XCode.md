1. 启用 Xcode（需 sudo，你在终端执行）


bash

sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
sudo xcodebuild -runFirstLaunch
xcodebuild -version
然后在 Xcode → Settings → Components 中下载 iOS 模拟器运行时（当前没有安装任何 runtime）。

2. 补齐工具链


bash

rustup target add aarch64-apple-ios aarch64-apple-ios-sim
brew install cocoapods
cd /Users/mac/Workspace/linlannet/dsh-java-mobile && npm install

3. 初始化 iOS 工程


bash

npm run ios:init        # 生成 src-tauri/gen/apple（Xcode 工程）
npx tauri ios dev       # 先跑模拟器；h5-dist 产物已存在
npx tauri ios dev --device   # 真机（需在 Xcode 里选 Team）

4. 工程配置

在 tauri.conf.json 的 bundle 中加上 "iOS": { "minimumSystemVersion": "15.0" }，以满足 7.1 的要求。
用 Xcode 打开 src-tauri/gen/apple/*.xcodeproj，配置 Team、Bundle ID 与 Android 对齐（net.linlan.dsh），并配置 Info.plist 的 ATS/本地网络、Bonjour、相机/相册、通知、dsh:// scheme（对应 7.2、7.5）。
5. 之后的开发顺序
   7.2 ATS 与本地网络 → 7.3 Keychain（Swift 插件）→ 7.4 文件/分享 → 7.5 通知/深链 → 7.6 TestFlight。
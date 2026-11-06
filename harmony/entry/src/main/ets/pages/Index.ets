import { webview } from "@kit.ArkWeb";
import { DshBridge } from "../bridge/DshBridge";

@Entry
@Component
struct Index {
  controller: webview.WebviewController = new webview.WebviewController();
  bridge: DshBridge = new DshBridge();
  @State loadFailed: boolean = false;

  build() {
    Column() {
      if (this.loadFailed) {
        Column() {
          Text("页面加载失败")
            .fontSize(16)
            .margin({ bottom: 16 })
          Button("重新加载")
            .onClick(() => {
              this.loadFailed = false;
              this.controller.refresh();
            })
        }
        .width("100%")
        .height("100%")
        .justifyContent(FlexAlign.Center)
      } else {
        Web({
          src: $rawfile("h5/index.html"),
          controller: this.controller
        })
          .javaScriptAccess(true)
          .domStorageAccess(true)
          .fileAccess(false)
          .multiWindowAccess(false)
          .zoomAccess(false)
          .mixedMode(MixedMode.None)
          .javaScriptProxy({
            object: this.bridge,
            name: "dshBridge",
            methodList: ["invoke", "getVersion"],
            controller: this.controller
          })
          .onErrorReceive(() => {
            this.loadFailed = true;
          })
          .onHttpErrorReceive((event) => {
            if (event && event.response && event.response.getResponseCode() >= 500) {
              this.loadFailed = true;
            }
          })
          .width("100%")
          .height("100%")
      }
    }
    .width("100%")
    .height("100%")
  }
}
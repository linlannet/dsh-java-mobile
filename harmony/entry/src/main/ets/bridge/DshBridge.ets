export interface BridgeRequest {
  id: string;
  method: string;
  args: string;
}

/**
 * 鸿蒙 JSBridge 壳侧实现。
 * 约束：单命名空间 `dshBridge`、协议版本、方法白名单、同步返回、超时由 H5 侧控制。
 */
export class DshBridge {
  private readonly version: number = 1;
  private readonly allowed: string[] = [
    "app.version",
    "storage.get",
    "storage.set",
    "storage.remove",
    "clipboard.write",
    "clipboard.read",
    "network.status",
    "external.openUrl",
    "share.open",
    "diagnostics.export"
  ];

  getVersion(): number {
    return this.version;
  }

  invoke(requestJson: string): string {
    try {
      const request = JSON.parse(requestJson) as BridgeRequest;
      if (!request || typeof request.id !== "string") {
        return this.reply("", false, null, "INVALID_REQUEST");
      }
      if (!this.allowed.includes(request.method)) {
        return this.reply(request.id, false, null, "UNSUPPORTED");
      }
      const data = this.dispatch(request.method, request.args);
      return this.reply(request.id, true, data, "");
    } catch (error) {
      return this.reply("", false, null, "BRIDGE_ERROR");
    }
  }

  private dispatch(method: string, args: string): string {
    switch (method) {
      case "app.version":
        return JSON.stringify({ version: "0.1.0", bridgeVersion: this.version });
      case "storage.get":
        return JSON.stringify({ value: null });
      case "storage.set":
      case "storage.remove":
        return JSON.stringify({ ok: true });
      case "clipboard.write":
        return JSON.stringify({ ok: true });
      case "clipboard.read":
        return JSON.stringify({ value: "" });
      case "network.status":
        return JSON.stringify({ online: true, type: "unknown" });
      case "external.openUrl":
      case "share.open":
        return JSON.stringify({ ok: true });
      case "diagnostics.export":
        return JSON.stringify({ host: "harmony", bridgeVersion: this.version, artifactHash: "" });
      default:
        throw new Error("unsupported method");
    }
  }

  private reply(id: string, ok: boolean, data: string | null, code: string): string {
    return JSON.stringify({ id: id, ok: ok, data: data, code: code });
  }
}
import { Button, Input, Text, View } from "@tarojs/components";
import { useState } from "react";
import { clear_session, current_session, login, type miniapp_session } from "../../sdk/auth";
import "./index.scss";

type login_status = "idle" | "loading" | "ok" | "error";

export default function Index() {
  const [base_url, set_base_url] = useState("https://");
  const [status, set_status] = useState<login_status>("idle");
  const [message, set_message] = useState("");
  const [session, set_session] = useState<miniapp_session | null>(current_session());

  const on_login = async () => {
    set_status("loading");
    set_message("");
    try {
      const result = await login(base_url);
      set_session(result);
      set_status("ok");
      set_message(`已登录，会话有效期至 ${result.expiresAt}`);
    } catch (cause) {
      const text = cause instanceof Error ? cause.message : "登录失败";
      set_status("error");
      set_message(
        text.includes("50300") || text.includes("未配置")
          ? "服务端未配置微信 AppID/AppSecret（50300）"
          : text,
      );
    }
  };

  const on_logout = () => {
    clear_session();
    set_session(null);
    set_status("idle");
    set_message("已清除本地会话");
  };

  const display = session
    ? `已登录（${session.expiresAt.slice(0, 19)}）`
    : status === "loading"
      ? "登录中…"
      : "未登录";

  return (
    <View className="index">
      <Text className="index-title">DSH Java</Text>
      <Text className="index-desc">
        小程序端复用 desktop 的协议层与业务模型；请填写 Agent 的 HTTPS 地址后微信登录。
      </Text>

      <View className="index-field">
        <Text className="index-field-label">服务器地址</Text>
        <Input
          className="index-input"
          value={base_url}
          placeholder="https://dsh.example.com"
          onInput={(event) => set_base_url(event.detail.value)}
        />
      </View>

      <View className="index-card">
        <Text className="index-card-label">登录状态</Text>
        <Text className="index-card-value">{display}</Text>
        {message ? (
          <Text className={status === "error" ? "index-message error" : "index-message"}>{message}</Text>
        ) : null}
      </View>

      {session ? (
        <Button type="warn" onClick={on_logout}>
          退出登录
        </Button>
      ) : (
        <Button type="primary" loading={status === "loading"} onClick={on_login}>
          微信登录
        </Button>
      )}

      <Text className="index-hint">
        能力降级：小程序不提供安全存储、Git 与本地文件能力；流式对话降级为提交 + 轮询对账。
      </Text>
    </View>
  );
}
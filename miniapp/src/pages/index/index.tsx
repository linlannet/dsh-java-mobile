import { Button, Text, View } from "@tarojs/components";
import { useState } from "react";
import "./index.scss";

export default function Index() {
  const [status] = useState("未连接");

  return (
    <View className="index">
      <Text className="index-title">DSH Java</Text>
      <Text className="index-desc">
        小程序端复用 desktop 的协议层与业务模型；连接 Agent 需配置 HTTPS 域名白名单。
      </Text>

      <View className="index-card">
        <Text className="index-card-label">连接状态</Text>
        <Text className="index-card-value">{status}</Text>
      </View>

      <Button type="primary" disabled>
        连接桌面端（待配置域名）
      </Button>

      <Text className="index-hint">
        能力降级：小程序不提供安全存储、Git 与本地文件能力，诊断仅导出精简信息。
      </Text>
    </View>
  );
}
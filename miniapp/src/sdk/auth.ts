import Taro from "@tarojs/taro";

export interface miniapp_session {
  token: string;
  expiresAt: string;
}

const SESSION_KEY = "dsh-miniapp-session";

interface login_reply {
  code?: string;
  info?: string;
  data?: miniapp_session;
}

/**
 * 微信登录：code → 服务端换取会话 token。
 * 依赖后端 `/api/miniapp/login`（待实现；需配置 appid/secret）。
 */
export async function login(base_url: string): Promise<miniapp_session> {
  const { code } = await Taro.login();
  if (!code) throw new Error("微信登录未返回 code");

  const response = await Taro.request({
    url: `${base_url.replace(/\/+$/, "")}/api/miniapp/login`,
    method: "POST",
    data: { code },
  });

  const payload = (response.data ?? {}) as login_reply;
  if (response.statusCode !== 200 || payload.code !== "00000" || !payload.data) {
    throw new Error(payload.info || `登录失败：HTTP ${response.statusCode}`);
  }

  Taro.setStorageSync(SESSION_KEY, payload.data);
  return payload.data;
}

export function current_session(): miniapp_session | null {
  const value = Taro.getStorageSync(SESSION_KEY) as miniapp_session | "";
  return value && value.token ? value : null;
}

export function clear_session(): void {
  Taro.removeStorageSync(SESSION_KEY);
}

/**
 * 订阅消息：返回是否至少接受一个模板。
 * 模板 ID 需在微信公众平台申请后填入。
 */
export async function request_subscribe(tmpl_ids: string[]): Promise<boolean> {
  if (tmpl_ids.length === 0) return false;
  const result = await Taro.requestSubscribeMessage({ tmplIds: tmpl_ids });
  return Object.values(result).some((value) => value === "accept");
}
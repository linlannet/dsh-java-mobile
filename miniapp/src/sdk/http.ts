import Taro from "@tarojs/taro";

export interface api_envelope<T> {
  code?: string;
  info?: string;
  data?: T;
}

export interface request_options {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: unknown;
  token?: string | null;
}

/**
 * 小程序统一请求：只接受 HTTPS，按 code/HTTP 状态判定成败。
 * 与服务端 `net.linlan.dsh.api.response.Response` 信封对齐。
 */
export async function request<T>(
  base_url: string,
  path: string,
  options: request_options = {},
): Promise<T> {
  const url = `${base_url.replace(/\/+$/, "")}${path}`;
  if (!url.startsWith("https://") && !url.startsWith("http://127.0.0.1")) {
    throw new Error("小程序仅允许 HTTPS 域名（本地调试可在开发者工具关闭域名校验）");
  }

  const header: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) {
    header.Authorization = `Bearer ${options.token}`;
  }

  const response = await Taro.request({
    url,
    method: (options.method ?? "GET") as never,
    header,
    data: options.data as never,
  });

  const payload = (response.data ?? {}) as api_envelope<T>;
  if (response.statusCode !== 200 || payload.code !== "00000") {
    throw new Error(payload.info || `请求失败：HTTP ${response.statusCode}`);
  }

  return payload.data as T;
}
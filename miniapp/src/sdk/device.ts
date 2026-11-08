import { request } from "./http";

export interface device_view {
  deviceId: string;
  deviceName: string;
  fingerprint: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface pairing_code {
  pairingCode: string;
  expiresAt: string;
  expiresInSeconds: number;
}

export interface device_pair_result {
  deviceId: string;
  deviceName: string;
  token: string;
  issuedAt: string;
}

/**
 * 设备配对与管理（小程序作为远程客户端时使用）。
 * 与 desktop `device_pairing.ts` 保持同一后端契约。
 */
export function read_mobile_access(base_url: string, token?: string | null): Promise<boolean> {
  return request<boolean>(base_url, "/api/devices/mobile-access", { token });
}

export function write_mobile_access(
  base_url: string,
  enabled: boolean,
  token?: string | null,
): Promise<boolean> {
  return request<boolean>(base_url, "/api/devices/mobile-access", {
    method: "PUT",
    data: { enabled },
    token,
  });
}

export function create_pairing_code(base_url: string, token?: string | null): Promise<pairing_code> {
  return request<pairing_code>(base_url, "/api/devices/pairing-codes", { method: "POST", token });
}

export function list_devices(base_url: string, token?: string | null): Promise<device_view[]> {
  return request<device_view[]>(base_url, "/api/devices", { token });
}

export function pair_device(
  base_url: string,
  pairing_code: string,
  device_name: string,
  fingerprint: string,
): Promise<device_pair_result> {
  return request<device_pair_result>(base_url, "/api/devices/pair", {
    method: "POST",
    data: {
      pairingCode: pairing_code.trim(),
      deviceName: device_name.trim(),
      fingerprint,
    },
  });
}

export function revoke_device(
  base_url: string,
  device_id: string,
  token?: string | null,
): Promise<void> {
  return request<null>(base_url, `/api/devices/${encodeURIComponent(device_id)}`, {
    method: "DELETE",
    token,
  }).then(() => undefined);
}

export function rotate_device(
  base_url: string,
  device_id: string,
  token?: string | null,
): Promise<device_pair_result> {
  return request<device_pair_result>(
    base_url,
    `/api/devices/${encodeURIComponent(device_id)}/rotate`,
    { method: "POST", token },
  );
}
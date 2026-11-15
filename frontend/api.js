import { API_BASE, DEMO_MODE } from "./config.js";

function errorMessage(data, status) {
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail)) return data.detail.map(item => item.msg).join("；");
  return `请求失败（HTTP ${status}）`;
}

async function request(path, { method = "GET", body, file = false, download = false } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body && !file ? { "Content-Type": "application/json" } : {},
      body: body ? (file ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new Error("无法连接后端，请检查服务地址、网络和跨域设置。");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(errorMessage(data, response.status));
  }
  if (download) {
    const type = response.headers.get("content-type") || "";
    if (!type.includes("spreadsheetml.sheet") && !type.includes("octet-stream")) {
      throw new Error("后端未返回有效的 Excel 下载响应，请核对接口。");
    }
    return { blob: await response.blob(), filename: "contacts.xlsx" };
  }
  if (response.status === 204) return null;
  return response.json();
}

const liveApi = {
  list: () => request("/contacts"),
  create: contact => request("/contacts", { method: "POST", body: contact }),
  update: (id, contact) => request(`/contacts/${encodeURIComponent(id)}`, { method: "PUT", body: contact }),
  remove: id => request(`/contacts/${encodeURIComponent(id)}`, { method: "DELETE" }),
  favorite: (id, value) => request(`/contacts/${encodeURIComponent(id)}/favorite`, { method: "PATCH", body: { is_favorite: value } }),
  importFile: file => {
    const form = new FormData();
    form.append("file", file);
    return request("/contacts/import", { method: "POST", body: form, file: true });
  },
  exportFile: () => request("/contacts/export", { download: true }),
};

export const api = DEMO_MODE ? (await import("./demo-api.js")).demoApi : liveApi;

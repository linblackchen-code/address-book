// Local development uses port 8000; deployed sites use same-origin /api.
const localHosts = ["localhost", "127.0.0.1", "[::1]"];
export const API_BASE = localHosts.includes(location.hostname)
  ? `${location.protocol}//${location.hostname}:8000/api`
  : "/api";
// Demo mode is explicitly opt-in and never substitutes for failed API requests.
export const DEMO_MODE = new URLSearchParams(location.search).get("demo") === "1";

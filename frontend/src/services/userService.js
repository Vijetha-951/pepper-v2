// Admin user management service
// Uses apiFetch so Authorization header (Firebase ID token) is automatically added

import { apiFetch } from "./api";

const BASE_URL = '/api/admin/users';
const DELIVERY_BASE_URL = '/api/admin/delivery-boys';

const handleJson = async (resp) => {
  let data = null;
  try {
    data = await resp.json();
  } catch (_) {
    /* ignore */
  }
  if (!resp.ok) {
    const message =
      data?.message || data?.error || `Request failed with ${resp.status}`;
    throw new Error(message);
  }
  return data;
};

const userService = {
  async searchUsers({ query = "", role = "", status = "", active = undefined, page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (role) params.set("role", role);

    // Backend now supports direct status parameter (approved/rejected/pending)
    if (status !== "" && status !== undefined) {
      params.set("status", String(status));
    } else if (active !== undefined && active !== "") {
      // Fallback to active parameter for backwards compatibility
      params.set("active", String(active));
    }

    params.set("page", String(page));
    params.set("limit", String(limit));

    const resp = await apiFetch(`${BASE_URL}?${params.toString()}`, {
      method: "GET",
    });

    const data = await handleJson(resp);

    // Normalize common REST shapes
    const users =
      data.users ||
      data.items ||
      data.data?.users ||
      data.data?.items ||
      [];
    const total = data.total ?? data.count ?? data.data?.total ?? 0;
    const pageNum = data.page ?? data.data?.page ?? page;
    const pageSize =
      data.pageSize ?? data.limit ?? data.perPage ?? data.data?.pageSize ?? limit;

    return { users, total, page: pageNum, pageSize };
  },

  async approveUser(userId) {
    const resp = await apiFetch(`${BASE_URL}/${encodeURIComponent(userId)}/approve`, {
      method: "PATCH",
    });
    return handleJson(resp);
  },

  async rejectUser(userId, reason = "") {
    const resp = await apiFetch(`${BASE_URL}/${encodeURIComponent(userId)}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    return handleJson(resp);
  },

  async updateUserRole(userId, role) {
    const resp = await apiFetch(`${BASE_URL}/${encodeURIComponent(userId)}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    return handleJson(resp);
  },

  async updateUserAreas(userId, areas = []) {
    // Split a flat list like ["680001", "Palakkad"] into expected shape
    const pincodes = [];
    const districts = [];
    for (const a of areas) {
      const val = String(a || '').trim();
      if (!val) continue;
      if (/^\d{4,6}$/.test(val)) pincodes.push(val);
      else districts.push(val);
    }

    const resp = await apiFetch(`${DELIVERY_BASE_URL}/${encodeURIComponent(userId)}/areas`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pincodes, districts }),
    });
    return handleJson(resp);
  },

  async deleteUser(userId) {
    const resp = await apiFetch(`${BASE_URL}/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    return handleJson(resp);
  },
};

export default userService;
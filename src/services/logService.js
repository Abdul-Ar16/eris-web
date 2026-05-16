// ─── System Log Service ──────────────────────────────────────────────────────

import API from './apiConstants.js';
import { get, post, del } from './httpClient.js';

const LogService = {
  /** Get all system logs */
  async getAll() {
    return get(API.logs);
  },

  /** Get logs by severity (INFO / WARNING / ERROR / CRITICAL) */
  async getBySeverity(severity) {
    return get(`${API.logs}/severity/${severity}`);
  },

  /** Get logs by category */
  async getByCategory(category) {
    return get(`${API.logs}/category/${category}`);
  },

  /** Get logs by user */
  async getByUser(userId) {
    return get(`${API.logs}/user/${userId}`);
  },

  /** Create a log entry */
  async create(data) {
    return post(API.logs, data);
  },

  /** Delete a log */
  async remove(id) {
    return del(`${API.logs}/${id}`);
  },
};

export default LogService;

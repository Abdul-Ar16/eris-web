// ─── Alert Service ───────────────────────────────────────────────────────────
// Mirrors Flutter alert_service.dart — CRUD operations for disaster alerts

import API from './apiConstants.js';
import { get, post, put, patch, del } from './httpClient.js';

const AlertService = {
  /** Get all alerts */
  async getAll() {
    return get(API.alerts);
  },

  /** Get active alerts only */
  async getActive() {
    return get(API.activeAlerts);
  },

  /** Get alert by ID */
  async getById(id) {
    return get(`${API.alerts}/${id}`);
  },

  /** Get alerts by district */
  async getByDistrict(district) {
    return get(`${API.alerts}/district/${district}`);
  },

  /** Get active alerts by district */
  async getActiveByDistrict(district) {
    return get(`${API.alerts}/district/${district}/active`);
  },

  /** Get alerts by type (FLOOD / LANDSLIDE) */
  async getByType(type) {
    return get(`${API.alerts}/type/${type}`);
  },

  /** Create a new alert for a station */
  async create(stationId, alertData) {
    return post(`${API.alerts}/station/${stationId}`, alertData);
  },

  /** Resolve an alert */
  async resolve(id) {
    return patch(`${API.alerts}/${id}/resolve`);
  },

  /** Update an alert */
  async update(id, alertData) {
    return put(`${API.alerts}/${id}`, alertData);
  },

  /** Delete an alert */
  async remove(id) {
    return del(`${API.alerts}/${id}`);
  },
};

export default AlertService;

// ─── Station Service ─────────────────────────────────────────────────────────
// Mirrors Flutter monitor_service.dart — CRUD for monitoring stations

import API from './apiConstants.js';
import { get, post, put, patch, del } from './httpClient.js';

const StationService = {
  /** Get all monitoring stations */
  async getAll() {
    return get(API.stations);
  },

  /** Get station by ID */
  async getById(id) {
    return get(`${API.stations}/${id}`);
  },

  /** Get stations by district */
  async getByDistrict(district) {
    return get(`${API.stations}/district/${district}`);
  },

  /** Get stations by type (FLOOD / LANDSLIDE) */
  async getByType(type) {
    return get(`${API.stations}/type/${type}`);
  },

  /** Create a new station */
  async create(stationData) {
    return post(API.stations, stationData);
  },

  /** Update station status */
  async updateStatus(id, status) {
    return patch(`${API.stations}/${id}/status?status=${status}`);
  },

  /** Update station */
  async update(id, stationData) {
    return put(`${API.stations}/${id}`, stationData);
  },

  /** Delete station */
  async remove(id) {
    return del(`${API.stations}/${id}`);
  },
};

export default StationService;

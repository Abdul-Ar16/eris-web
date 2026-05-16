// ─── Sensor Service ──────────────────────────────────────────────────────────
// Mirrors Flutter monitor_service.dart (sensor portion)

import API from './apiConstants.js';
import { get, post } from './httpClient.js';

const SensorService = {
  /** Save a sensor reading for a station */
  async save(stationId, readingData) {
    return post(`${API.sensors}/station/${stationId}`, readingData);
  },

  /** Get all readings for a station */
  async getByStation(stationId) {
    return get(`${API.sensors}/station/${stationId}`);
  },

  /** Get latest 10 readings for a station */
  async getLatest(stationId) {
    return get(`${API.sensors}/station/${stationId}/latest`);
  },

  /** Get readings by risk level (SAFE / WARNING / DANGER) */
  async getByRisk(riskLevel) {
    return get(`${API.sensors}/risk/${riskLevel}`);
  },
};

export default SensorService;

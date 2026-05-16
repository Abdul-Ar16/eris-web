// ─── Weather Service ─────────────────────────────────────────────────────────
// Mirrors weather data endpoints from the backend

import API from './apiConstants.js';
import { get, post, del } from './httpClient.js';

const WeatherService = {
  /** Get all weather data */
  async getAll() {
    return get(API.weather);
  },

  /** Get weather data by district */
  async getByDistrict(district) {
    return get(`${API.weather}/district/${district}`);
  },

  /** Get latest weather for a district */
  async getLatest(district) {
    return get(`${API.weather}/district/${district}/latest`);
  },

  /** Get weather data by risk level */
  async getByRisk(risk) {
    return get(`${API.weather}/risk/${risk}`);
  },

  /** Save weather data */
  async save(data) {
    return post(API.weather, data);
  },

  /** Delete weather data */
  async remove(id) {
    return del(`${API.weather}/${id}`);
  },
};

export default WeatherService;

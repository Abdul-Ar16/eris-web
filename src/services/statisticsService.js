// ─── Statistics Service ──────────────────────────────────────────────────────
// Mirrors Flutter statistics_service.dart

import API from './apiConstants.js';
import { get, post, put, del } from './httpClient.js';

const StatisticsService = {
  /** Get all statistics */
  async getAll() {
    return get(API.statistics);
  },

  /** Get statistics by district */
  async getByDistrict(district) {
    return get(`${API.statistics}/district/${district}`);
  },

  /** Get statistics by month and year */
  async getByMonthYear(month, year) {
    return get(`${API.statistics}/month/${month}/year/${year}`);
  },

  /** Get statistics by district and year */
  async getByDistrictYear(district, year) {
    return get(`${API.statistics}/district/${district}/year/${year}`);
  },

  /** Create statistics */
  async create(data) {
    return post(API.statistics, data);
  },

  /** Update statistics */
  async update(id, data) {
    return put(`${API.statistics}/${id}`, data);
  },

  /** Delete statistics */
  async remove(id) {
    return del(`${API.statistics}/${id}`);
  },
};

export default StatisticsService;

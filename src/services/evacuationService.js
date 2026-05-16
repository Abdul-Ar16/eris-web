// ─── Evacuation Route Service ────────────────────────────────────────────────
// Mirrors Flutter evacuation_service.dart

import API from './apiConstants.js';
import { get, post, put, del } from './httpClient.js';

const EvacuationService = {
  /** Get all evacuation routes */
  async getAll() {
    return get(API.evacuationRoutes);
  },

  /** Get route by ID */
  async getById(id) {
    return get(`${API.evacuationRoutes}/${id}`);
  },

  /** Get routes by district */
  async getByDistrict(district) {
    return get(`${API.evacuationRoutes}/district/${district}`);
  },

  /** Get routes by disaster type (FLOOD / LANDSLIDE) */
  async getByType(type) {
    return get(`${API.evacuationRoutes}/type/${type}`);
  },

  /** Get routes by district and type */
  async getByDistrictAndType(district, type) {
    return get(`${API.evacuationRoutes}/district/${district}/type/${type}`);
  },

  /** Create route */
  async create(data) {
    return post(API.evacuationRoutes, data);
  },

  /** Update route */
  async update(id, data) {
    return put(`${API.evacuationRoutes}/${id}`, data);
  },

  /** Delete route */
  async remove(id) {
    return del(`${API.evacuationRoutes}/${id}`);
  },
};

export default EvacuationService;

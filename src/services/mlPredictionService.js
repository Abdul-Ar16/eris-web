// ─── ML Prediction Service ───────────────────────────────────────────────────
// Mirrors Flutter ml_prediction_service.dart

import API from './apiConstants.js';
import { get, post } from './httpClient.js';

const MlPredictionService = {
  /** Get the latest ML prediction */
  async getLatest() {
    return get(API.mlPredictionLatest);
  },

  /** Get prediction history (all, newest first) */
  async getHistory() {
    return get(API.mlPredictionHistory);
  },

  /** Get predictions for a specific district (top 10) */
  async getByDistrict(district) {
    return get(`${API.mlPrediction}/district/${district}`);
  },

  /** Submit a prediction (used by the Python MQTT bridge) */
  async submit(predictionData) {
    return post(API.mlPrediction, predictionData);
  },
};

export default MlPredictionService;

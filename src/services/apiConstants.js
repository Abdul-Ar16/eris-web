// ─── API Constants ────────────────────────────────────────────────────────────
// Mirrors the Flutter api_constants.dart — single source of truth for all endpoints.
// Points to the deployed Render backend (same as the mobile app).

const API_BASE_URL = 'https://eris-backend-bepl.onrender.com/api';

const ApiConstants = {
  baseUrl: API_BASE_URL,

  // ── Auth ─────────────────────────────────────────────────
  register:            `${API_BASE_URL}/auth/register`,
  login:               `${API_BASE_URL}/auth/login`,
  profile:             `${API_BASE_URL}/auth/profile`,
  changePassword:      `${API_BASE_URL}/auth/change-password`,
  forgotPassword:      `${API_BASE_URL}/auth/forgot-password`,
  resetPassword:       `${API_BASE_URL}/auth/reset-password`,
  users:               `${API_BASE_URL}/auth/users`,

  // ── Alerts ───────────────────────────────────────────────
  alerts:              `${API_BASE_URL}/alerts`,
  activeAlerts:        `${API_BASE_URL}/alerts/active`,

  // ── Disaster Reports ─────────────────────────────────────
  reports:             `${API_BASE_URL}/reports`,

  // ── Disaster Statistics ──────────────────────────────────
  statistics:          `${API_BASE_URL}/statistics`,

  // ── Emergency Contacts ───────────────────────────────────
  emergencyContacts:   `${API_BASE_URL}/emergency-contacts`,

  // ── Evacuation Routes ────────────────────────────────────
  evacuationRoutes:    `${API_BASE_URL}/evacuation-routes`,

  // ── Monitoring Stations ──────────────────────────────────
  stations:            `${API_BASE_URL}/stations`,

  // ── Notifications ────────────────────────────────────────
  notifications:       `${API_BASE_URL}/notifications`,

  // ── Safe Zones ───────────────────────────────────────────
  safeZones:           `${API_BASE_URL}/safe-zones`,

  // ── Sensor Readings ──────────────────────────────────────
  sensors:             `${API_BASE_URL}/sensors`,

  // ── System Logs ──────────────────────────────────────────
  logs:                `${API_BASE_URL}/logs`,

  // ── User Alerts ──────────────────────────────────────────
  userAlerts:          `${API_BASE_URL}/user-alerts`,

  // ── User Locations ───────────────────────────────────────
  locations:           `${API_BASE_URL}/locations`,

  // ── Weather Data ─────────────────────────────────────────
  weather:             `${API_BASE_URL}/weather`,

  // ── Dashboard ────────────────────────────────────────────
  dashboardSummary:    `${API_BASE_URL}/dashboard/summary`,

  // ── ML Predictions (Random Forest) ───────────────────────
  mlPrediction:        `${API_BASE_URL}/ml/prediction`,
  mlPredictionLatest:  `${API_BASE_URL}/ml/prediction/latest`,
  mlPredictionHistory: `${API_BASE_URL}/ml/prediction/history`,
};

export default ApiConstants;

// ─── Notification Service ────────────────────────────────────────────────────
// Mirrors Flutter notification_service.dart

import API from './apiConstants.js';
import { get, post, patch, del } from './httpClient.js';

const NotificationService = {
  /** Create notification for a user */
  async create(userId, data) {
    return post(`${API.notifications}/user/${userId}`, data);
  },

  /** Get all notifications for a user */
  async getByUser(userId) {
    return get(`${API.notifications}/user/${userId}`);
  },

  /** Get unread notifications for a user */
  async getUnread(userId) {
    return get(`${API.notifications}/user/${userId}/unread`);
  },

  /** Count unread notifications */
  async countUnread(userId) {
    return get(`${API.notifications}/user/${userId}/unread/count`);
  },

  /** Get notification by ID */
  async getById(id) {
    return get(`${API.notifications}/${id}`);
  },

  /** Mark notification as read */
  async markRead(id) {
    return patch(`${API.notifications}/${id}/read`);
  },

  /** Delete notification */
  async remove(id) {
    return del(`${API.notifications}/${id}`);
  },
};

export default NotificationService;

// ─── Auth Service ────────────────────────────────────────────────────────────
// Mirrors Flutter auth_service.dart — login, register, profile, password reset

import API from './apiConstants.js';
import { post, get, put, del, saveSession, clearSession, getUser, getToken } from './httpClient.js';

const AuthService = {
  /** Login and persist session */
  async login(email, password) {
    const data = await post(API.login, { email, password });
    if (data.token) {
      saveSession(data.token, {
        id:                data.id,
        fullName:          data.fullName,
        email:             data.email,
        role:              data.role,
        district:          data.district,
        phoneNumber:       data.phoneNumber,
        preferredLanguage: data.preferredLanguage,
      });
    }
    return data;
  },

  /** Register a new user */
  async register(userData) {
    return post(API.register, userData);
  },

  /** Logout — clear local session */
  logout() {
    clearSession();
    window.location.reload();
  },

  /** Get current user's profile (requires token) */
  async getProfile() {
    return get(API.profile);
  },

  /** Update current user's profile */
  async updateProfile({ fullName, phoneNumber, district, preferredLanguage }) {
    return put(API.profile, { fullName, phoneNumber, district, preferredLanguage });
  },

  /** Change password (requires current password) */
  async changePassword(currentPassword, newPassword) {
    return post(API.changePassword, { currentPassword, newPassword });
  },

  /** Forgot password — request OTP */
  async forgotPassword(email) {
    return post(API.forgotPassword, { email });
  },

  /** Reset password with email + new password */
  async resetPassword(email, newPassword) {
    return post(API.resetPassword, { email, newPassword });
  },

  /** Get all users (admin) */
  async getAllUsers() {
    return get(API.users);
  },

  /** Get user by ID (admin) */
  async getUserById(id) {
    return get(`${API.users}/${id}`);
  },

  /** Update user (admin) */
  async updateUser(id, userData) {
    return put(`${API.users}/${id}`, userData);
  },

  /** Delete user (admin) */
  async deleteUser(id) {
    return del(`${API.users}/${id}`);
  },

  /** Get locally-stored user */
  getCurrentUser() {
    return getUser();
  },

  /** Check if authenticated */
  isLoggedIn() {
    return !!getToken();
  },
};

export default AuthService;

// ─── Dashboard Service ───────────────────────────────────────────────────────

import API from './apiConstants.js';
import { get } from './httpClient.js';

const DashboardService = {
  /** Get dashboard summary (counts, stats) */
  async getSummary() {
    return get(API.dashboardSummary);
  },
};

export default DashboardService;

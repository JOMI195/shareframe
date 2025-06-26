import * as DashboardSlice from "./dashboard.slice";
import { apiRequest } from "@/common/utils/constants/api.constants";
import * as DashboardEndpoints from "@/assets/endpoints/api/dashboardEndpoints";

export const fetchDashboardStats = () =>
  apiRequest({
    url: DashboardEndpoints.getDashboardStatsUrl(),
    onStart: DashboardSlice.dashboardStatsRequested.type,
    onSuccess: DashboardSlice.dashboardStatsReceived.type,
    onError: DashboardSlice.dashboardStatsRequestFailed.type,
  });

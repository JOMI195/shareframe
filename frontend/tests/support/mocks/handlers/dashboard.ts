import { http, HttpResponse } from 'msw';
import * as dashboard from '@/assets/endpoints/api/dashboardEndpoints';
import { makeDashboardData } from '../../fixtures';
import { apiUrl } from '../apiUrl';

export const dashboardHandlers = [
  http.get(apiUrl(dashboard.getDashboardStatsUrl()), () => HttpResponse.json(makeDashboardData())),
];

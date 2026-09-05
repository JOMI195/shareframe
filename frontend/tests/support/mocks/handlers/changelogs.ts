import { http, HttpResponse } from 'msw';
import * as changelogs from '@/assets/endpoints/api/changelogsEndpoints';
import { apiUrl } from '../apiUrl';

export const changelogHandlers = [
  http.get(apiUrl(changelogs.getChangelogIdsUrl()), () => HttpResponse.json([])),
  http.post(apiUrl(changelogs.getChangelogsByIdsUrl()), () => HttpResponse.json([])),
];

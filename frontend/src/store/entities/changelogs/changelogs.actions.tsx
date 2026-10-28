import * as changelogsSlice from "./changelogs.slice";
import { apiRequest } from "@/common/utils/constants/api.constants";
import * as changelogsEndpoints from "@/assets/endpoints/api/changelogsEndpoints";
import { AppDispatch, RootState } from "@/store";
import { getDeactivatedIds } from "@/store/ui/changelogs/changelogs.slice";
import { fetchIfStale } from "@/store/fetchIfStale";

export const fetchChangelogIds = () =>
    apiRequest({
        url: changelogsEndpoints.getChangelogIdsUrl(),
        onStart: changelogsSlice.changelogIdsRequested.type,
        onSuccess: changelogsSlice.changelogIdsReceived.type,
        onError: changelogsSlice.changelogIdsRequestFailed.type,
    });

export const fetchChangelogsByIds = (ids: number[]) =>
    apiRequest({
        url: changelogsEndpoints.getChangelogsByIdsUrl(),
        method: "post",
        onStart: changelogsSlice.changelogsRequested.type,
        onSuccess: changelogsSlice.changelogsReceived.type,
        onError: changelogsSlice.changelogsRequestFailed.type,
        data: { ids },
    });

const IDS_MAX_AGE_MS = 5 * 60 * 1000;

export const fetchChangelogIdsIfStale = () =>
    fetchIfStale((state) => changelogsSlice.getApi(state).idsLastFetch, IDS_MAX_AGE_MS, fetchChangelogIds);

export const fetchMissingChangelogs =
    (ids: number[]) => (dispatch: AppDispatch, getState: () => RootState) => {
        const loaded = new Set(changelogsSlice.getChangelogs(getState()).map((log) => log.id));
        const missing = ids.filter((id) => !loaded.has(id));
        if (missing.length > 0) dispatch(fetchChangelogsByIds(missing));
    };

// Only the newest entry is ever announced, so only its content is needed up front.
export const fetchNewestChangelog =
    () => (dispatch: AppDispatch, getState: () => RootState) => {
        const state = getState();
        const newest = changelogsSlice.getSortedChangelogIds(state)[0];
        if (!newest || getDeactivatedIds(state).includes(newest.id)) return;
        dispatch(fetchMissingChangelogs([newest.id]));
    };

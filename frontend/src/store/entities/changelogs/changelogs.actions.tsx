import * as changelogsSlice from "./changelogs.slice";
import { apiRequest } from "@/common/utils/constants/api.constants";
import * as changelogsEndpoints from "@/assets/endpoints/api/changelogsEndpoints";
import { AppDispatch, RootState } from "@/store";
import { getDeactivatedIds } from "@/store/ui/changelogs/changelogs.slice";

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

export const fetchActiveChangelogs =
    () => (dispatch: AppDispatch, getState: () => RootState) => {
        const state = getState();
        const allIds = changelogsSlice.getChangelogIds(state).map((item: { id: number }) => item.id);
        const deactivatedIds = getDeactivatedIds(state);
        const activeIds = allIds.filter((id: number) => !deactivatedIds.includes(id));

        if (activeIds.length > 0) {
            dispatch(fetchChangelogsByIds(activeIds));
        } else {
            dispatch(changelogsSlice.changelogsReceived([]));
        }
    };

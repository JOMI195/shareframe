import { useAppDispatch } from '@/store';
import { fetchChangelogIds, fetchChangelogIdsIfStale, fetchMissingChangelogs, fetchNewestChangelog, publishedBeforeJoining } from '@/store/entities/changelogs/changelogs.actions';
import { getUser } from '@/store/entities/authentication/authentication.slice';
import { getApi, getChangelogIds, getChangelogs, getSortedChangelogIds } from '@/store/entities/changelogs/changelogs.slice';
import { clearOutdatedDeactivatedIds, toggleChangelogDeactivation } from '@/store/ui/changelogs/changelogs.actions';
import { getDeactivatedIds } from '@/store/ui/changelogs/changelogs.slice';
import { useSelector } from 'react-redux';
import { useCallback } from 'react';

export const useChangelogs = () => {
    const dispatch = useAppDispatch();
    const api = useSelector(getApi);
    const changelogIds = useSelector(getChangelogIds);
    const changelogs = useSelector(getChangelogs);
    const sortedChangelogIds = useSelector(getSortedChangelogIds);
    const deactivatedIds = useSelector(getDeactivatedIds);
    const dateJoined = useSelector(getUser).me.date_joined;

    const loadChangelogIds = useCallback(() => {
        dispatch(fetchChangelogIds());
    }, [dispatch]);

    const refreshChangelogIds = useCallback(() => {
        dispatch(fetchChangelogIdsIfStale());
    }, [dispatch]);

    const loadNewestChangelog = useCallback(() => {
        dispatch(fetchNewestChangelog());
    }, [dispatch]);

    const cleanUpdDeactivatedIds = useCallback(() => {
        // Callers fire this on mount, before the ids are fetched; an empty list would drop every dismissal.
        if (changelogIds.length === 0) return;
        dispatch(clearOutdatedDeactivatedIds(changelogIds.map(log => log.id)));
    }, [dispatch, changelogIds]);

    const loadChangelogsByIds = useCallback((ids: number[]) => {
        dispatch(fetchMissingChangelogs(ids));
    }, [dispatch]);

    const toggleChangelogActive = (id: number) => {
        dispatch(toggleChangelogDeactivation(id));
    };

    const deactivateChangelog = (id: number) => {
        if (!deactivatedIds.includes(id)) {
            dispatch(toggleChangelogDeactivation(id));
        }
    };

    const isChangelogDeactivated = (id: number) => {
        return deactivatedIds.includes(id);
    };

    // Get the newest changelog that hasn't been deactivated
    const getNewestActiveChangelog = () => {
        if (sortedChangelogIds.length === 0 || changelogs.length === 0) return null;

        const newestId = sortedChangelogIds[0];

        if (!deactivatedIds.includes(newestId.id) && !publishedBeforeJoining(newestId.date, dateJoined)) {
            return changelogs.find(log => log.id === newestId.id) || null;
        }

        return null;
    };

    return {
        isLoading: api.loading || api.idsLoading,
        changelogIds,
        changelogs,
        sortedChangelogIds,
        deactivatedIds,

        loadChangelogIds,
        refreshChangelogIds,
        loadNewestChangelog,
        loadChangelogsByIds,
        toggleChangelogActive,
        deactivateChangelog,
        isChangelogDeactivated,
        getNewestActiveChangelog,
        cleanUpdDeactivatedIds
    };
};
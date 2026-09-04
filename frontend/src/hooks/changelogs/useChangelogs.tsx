import { useAppDispatch } from '@/store';
import { fetchActiveChangelogs, fetchChangelogIds, fetchChangelogsByIds } from '@/store/entities/changelogs/changelogs.actions';
import { getApi, getChangelogIds, getChangelogs } from '@/store/entities/changelogs/changelogs.slice';
import { clearOutdatedDeactivatedIds, toggleChangelogDeactivation } from '@/store/ui/changelogs/changelogs.actions';
import { getDeactivatedIds } from '@/store/ui/changelogs/changelogs.slice';
import { useSelector } from 'react-redux';
import { useCallback } from 'react';

export const useChangelogs = () => {
    const dispatch = useAppDispatch();
    const api = useSelector(getApi);
    const changelogIds = useSelector(getChangelogIds);
    const changelogs = useSelector(getChangelogs);
    const deactivatedIds = useSelector(getDeactivatedIds);

    const loadChangelogIds = useCallback(() => {
        dispatch(fetchChangelogIds());
    }, [dispatch]);

    const loadChangelogs = useCallback(() => {
        dispatch(fetchActiveChangelogs());
    }, [dispatch]);

    const cleanUpdDeactivatedIds = useCallback(() => {
        // Callers fire this on mount, before the ids are fetched; an empty list would drop every dismissal.
        if (changelogIds.length === 0) return;
        dispatch(clearOutdatedDeactivatedIds(changelogIds.map(log => log.id)));
    }, [dispatch, changelogIds]);

    const loadAllChangelogs = useCallback(() => {
        const allIds = changelogIds.map(item => item.id);
        dispatch(fetchChangelogsByIds(allIds));
    }, [dispatch, changelogIds]);

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
        if (changelogIds.length === 0 || changelogs.length === 0) return null;

        const sortedIds = [...changelogIds].sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        const newestId = sortedIds[0];

        if (!deactivatedIds.includes(newestId.id)) {
            return changelogs.find(log => log.id === newestId.id) || null;
        }

        return null;
    };

    return {
        isLoading: api.loading || api.idsLoading,
        changelogIds,
        changelogs,
        deactivatedIds,

        loadChangelogIds,
        loadChangelogs,
        loadAllChangelogs,
        toggleChangelogActive,
        deactivateChangelog,
        isChangelogDeactivated,
        getNewestActiveChangelog,
        cleanUpdDeactivatedIds
    };
};
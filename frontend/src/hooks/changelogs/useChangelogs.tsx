import { useAppDispatch } from '@/store';
import { fetchActiveChangelogs, fetchChangelogIds, fetchChangelogsByIds } from '@/store/entities/changelogs/changelogs.actions';
import { getApi, getChangelogIds, getChangelogs } from '@/store/entities/changelogs/changelogs.slice';
import { clearOutdatedDeactivatedIds, toggleChangelogDeactivation } from '@/store/ui/changelogs/changelogs.actions';
import { getDeactivatedIds } from '@/store/ui/changelogs/changelogs.slice';
import { useSelector } from 'react-redux';

export const useChangelogs = () => {
    const dispatch = useAppDispatch();
    const api = useSelector(getApi);
    const changelogIds = useSelector(getChangelogIds);
    const changelogs = useSelector(getChangelogs);
    const deactivatedIds = useSelector(getDeactivatedIds);

    const loadChangelogIds = () => {
        dispatch(fetchChangelogIds());
    };

    const loadChangelogs = () => {
        dispatch(fetchActiveChangelogs());
    };

    const cleanUpdDeactivatedIds = () => {
        dispatch(clearOutdatedDeactivatedIds(changelogIds.map(log => log.id)));
    };

    const loadAllChangelogs = () => {
        const allIds = changelogIds.map(item => item.id);
        dispatch(fetchChangelogsByIds(allIds));
    };

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
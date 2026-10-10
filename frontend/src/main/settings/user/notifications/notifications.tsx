import { Stack, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store';
import { getApi, getMyUserDetails } from '@/store/entities/authentication/authentication.slice';
import { updateMyNotificationPreferences } from '@/store/entities/authentication/authentication.actions';
import { INotificationKindPatch, IUser } from '@/types';
import DevicePush from './devicePush';
import KindSettings from './kindSettings';

const Notifications = () => {
    const dispatch = useAppDispatch();
    const me: IUser = useAppSelector(getMyUserDetails);
    const authApi = useAppSelector(getApi);
    const kinds = me.account.notification_preferences ?? [];

    const save = (patch: INotificationKindPatch) => {
        dispatch(updateMyNotificationPreferences([patch]));
    };

    return (
        <Stack spacing={2}>
            <DevicePush />
            {kinds.length === 0 ? (
                <Typography variant="body2">
                    Aktuell gibt es keine Benachrichtigungen, die du einstellen kannst.
                </Typography>
            ) : (
                kinds.map((settings) => (
                    <KindSettings key={settings.kind} settings={settings} disabled={authApi.loading} onChange={save} />
                ))
            )}
        </Stack>
    );
};

export default Notifications;

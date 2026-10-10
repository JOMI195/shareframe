import { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store';
import { getPwa, pushPromptDismissed } from '@/store/ui/settings/settings.slice';
import { usePwaInstall } from '@/hooks/pwa/usePwaInstall';
import { getPushSubscription, isPushSupported, subscribePush } from '@/common/utils/pwa/push';
import { ZoomTransition } from '../dialogTransitions';

const PushPrompt: React.FC = () => {
    const dispatch = useAppDispatch();
    const { installed } = usePwaInstall();
    const { pushPromptDismissed: dismissed } = useAppSelector(getPwa);
    const [unsubscribed, setUnsubscribed] = useState(false);

    const askable = installed && !dismissed && isPushSupported() && Notification.permission !== 'denied';

    useEffect(() => {
        if (!askable) return;

        let cancelled = false;
        getPushSubscription().then((subscription) => {
            if (!cancelled) setUnsubscribed(subscription === null);
        });
        return () => {
            cancelled = true;
        };
    }, [askable]);

    const dismiss = () => dispatch(pushPromptDismissed());

    const handleEnable = async () => {
        await subscribePush().catch(() => undefined);
        dismiss();
    };

    return (
        <Dialog
            open={askable && unsubscribed}
            onClose={dismiss}
            maxWidth="xs"
            fullWidth
            slots={{ transition: ZoomTransition }}
        >
            <DialogTitle>Push-Benachrichtigungen aktivieren?</DialogTitle>
            <DialogContent>
                <Typography>
                    Wir sagen dir Bescheid, wenn es bei ShareFrame etwas Neues gibt. Du kannst das jederzeit in den Einstellungen unter Benachrichtigungen ändern.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={dismiss}>Später</Button>
                <Button variant="contained" onClick={handleEnable}>Aktivieren</Button>
            </DialogActions>
        </Dialog>
    );
};

export default PushPrompt;

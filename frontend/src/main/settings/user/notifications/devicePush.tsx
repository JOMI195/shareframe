import { useEffect, useState } from 'react';
import { FormControlLabel, Paper, Switch, Typography } from '@mui/material';
import { getPushSubscription, isPushSupported, subscribePush, unsubscribePush } from '@/common/utils/pwa/push';
import { usePwaInstall } from '@/hooks/pwa/usePwaInstall';

const DevicePush = () => {
    const { installed } = usePwaInstall();
    const pushAvailable = installed && isPushSupported();

    const [subscribed, setSubscribed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [hint, setHint] = useState<string | null>(null);

    useEffect(() => {
        if (!pushAvailable) return;
        getPushSubscription().then((subscription) => setSubscribed(subscription !== null));
    }, [pushAvailable]);

    const toggle = async (enable: boolean) => {
        setBusy(true);
        setHint(null);
        try {
            if (!enable) {
                await unsubscribePush();
                setSubscribed(false);
                return;
            }
            const result = await subscribePush();
            setSubscribed(result === 'subscribed');
            if (result === 'denied') {
                setHint('Benachrichtigungen sind blockiert. Erlaube sie in den Einstellungen deines Geräts.');
            } else if (result === 'unavailable') {
                setHint('Push-Benachrichtigungen sind hier gerade nicht verfügbar.');
            }
        } catch {
            setHint('Push-Benachrichtigungen konnten nicht eingerichtet werden.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Push auf diesem Gerät
            </Typography>
            {pushAvailable ? (
                <>
                    <FormControlLabel
                        control={
                            <Switch checked={subscribed} disabled={busy} onChange={(event) => toggle(event.target.checked)} />
                        }
                        label="Push-Benachrichtigungen erhalten"
                    />
                    {hint && <Typography variant="body2" color="text.secondary">{hint}</Typography>}
                </>
            ) : (
                <Typography variant="body2">
                    Push-Benachrichtigungen gibt es nur in der installierten App. Installiere ShareFrame über die App-Einstellungen.
                </Typography>
            )}
        </Paper>
    );
};

export default DevicePush;

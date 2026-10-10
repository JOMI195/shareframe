import { useState } from 'react';
import { useParams } from 'react-router';
import { Box, Button, Typography } from '@mui/material';
import axiosInstance from '@/services/api';
import { getUnsubscribeUrl } from '@/assets/endpoints/api/notificationsEndpoints';

type Status = 'idle' | 'loading' | 'done' | 'error';

// The mail link only opens this page; the POST waits for a click so link scanners never unsubscribe.
const Unsubscribe = () => {
    const { token } = useParams();
    const [status, setStatus] = useState<Status>('idle');

    const unsubscribe = async () => {
        setStatus('loading');
        try {
            await axiosInstance.post(getUnsubscribeUrl(), { token });
            setStatus('done');
        } catch {
            setStatus('error');
        }
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', my: 4, textAlign: 'center' }}>
            <Typography component="h1" variant="h5" gutterBottom>
                E-Mail-Benachrichtigung abbestellen
            </Typography>
            {status === 'done' ? (
                <Typography variant="body1">
                    Du erhältst diese Benachrichtigung nicht mehr per E-Mail. Du kannst das jederzeit in deinem Nutzerkonto wieder ändern.
                </Typography>
            ) : (
                <>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                        Möchtest du diese Benachrichtigung nicht mehr per E-Mail erhalten?
                    </Typography>
                    <Button variant="contained" onClick={unsubscribe} disabled={status === 'loading'}>
                        Abbestellen
                    </Button>
                    {status === 'error' && (
                        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                            Der Link ist ungültig. Du kannst Benachrichtigungen in deinem Nutzerkonto abbestellen.
                        </Typography>
                    )}
                </>
            )}
        </Box>
    );
};

export default Unsubscribe;

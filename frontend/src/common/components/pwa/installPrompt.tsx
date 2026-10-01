import { useState } from 'react';
import { Alert, Box, Button, Snackbar, useMediaQuery, useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store';
import { getPwa, installPromptDismissed } from '@/store/ui/settings/settings.slice';
import { usePwaInstall } from '@/hooks/pwa/usePwaInstall';
import IosInstallDialog from './iosInstallDialog';

const InstallPrompt: React.FC = () => {
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const { installPromptDismissed: dismissed } = useAppSelector(getPwa);
    const { installed, canPrompt, showIosHint, promptInstall } = usePwaInstall();
    const [iosDialogOpen, setIosDialogOpen] = useState(false);

    const open = (canPrompt || showIosHint) && !installed && !dismissed;

    const dismiss = () => dispatch(installPromptDismissed());

    const handleClose = (_event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        dismiss();
    };

    const handleInstall = async () => {
        if (canPrompt) {
            await promptInstall();
        } else {
            setIosDialogOpen(true);
        }
        dismiss();
    };

    return (
        <>
            <Snackbar
                open={open}
                anchorOrigin={{ vertical: 'bottom', horizontal: isSmallScreen ? 'center' : 'left' }}
                sx={{
                    width: isSmallScreen ? '90%' : 'auto',
                    bottom: 16
                }}
                onClose={handleClose}
            >
                <Alert
                    severity="info"
                    variant="filled"
                    onClose={handleClose}
                    action={
                        <Box sx={{ display: 'flex', gap: 1, ml: !isSmallScreen ? 1 : 0 }}>
                            <Button color="inherit" size="small" onClick={dismiss}>
                                Später
                            </Button>
                            <Button variant="outlined" color="inherit" size="small" onClick={handleInstall}>
                                Installieren
                            </Button>
                        </Box>
                    }
                    sx={{
                        width: '100%',
                        color: theme.palette.common.white,
                        flexDirection: isSmallScreen ? 'column' : 'row',
                        alignItems: isSmallScreen ? 'flex-start' : 'center',
                        '& .MuiAlert-action': {
                            alignSelf: isSmallScreen ? 'flex-end' : 'center',
                            padding: isSmallScreen ? '8px 0 0' : 0
                        }
                    }}
                >
                    Installiere ShareFrame als App für den schnellen Zugriff.
                </Alert>
            </Snackbar>
            <IosInstallDialog open={iosDialogOpen} onClose={() => setIosDialogOpen(false)} />
        </>
    );
};

export default InstallPrompt;

import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import { usePwaInstall } from '@/hooks/pwa/usePwaInstall';
import IosInstallDialog from '@/common/components/pwa/iosInstallDialog';

const Install = () => {
    const { installed, canPrompt, showIosHint, promptInstall } = usePwaInstall();
    const [iosDialogOpen, setIosDialogOpen] = useState(false);

    const renderAction = () => {
        if (installed) {
            return <Typography variant="body1">ShareFrame ist bereits installiert.</Typography>;
        }
        if (canPrompt || showIosHint) {
            return (
                <Button
                    variant="contained"
                    startIcon={<InstallMobileIcon />}
                    onClick={canPrompt ? promptInstall : () => setIosDialogOpen(true)}
                >
                    App installieren
                </Button>
            );
        }
        return (
            <Typography variant="body2">
                Dein Browser bietet die Installation hier nicht an. Nutze dafür das Browsermenü oder öffne ShareFrame in Chrome, Edge oder Safari.
            </Typography>
        );
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                App installieren
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Installiere ShareFrame auf deinem Gerät und starte es wie eine App vom Home-Bildschirm oder Desktop.
            </Typography>
            {renderAction()}
            <IosInstallDialog open={iosDialogOpen} onClose={() => setIosDialogOpen(false)} />
        </Box>
    );
};

export default Install;

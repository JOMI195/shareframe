import { useState } from 'react';
import { Button, Typography } from '@mui/material';
import SettingsSection from '@/common/components/settings/settingsSection';
import FormActions from '@/common/components/settings/formActions';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import { usePwaInstall } from '@/hooks/pwa/usePwaInstall';
import IosInstallDialog from '@/common/components/pwa/iosInstallDialog';

const Install = () => {
    const { installed, canPrompt, showIosHint, promptInstall } = usePwaInstall();
    const [iosDialogOpen, setIosDialogOpen] = useState(false);

    const renderAction = () => {
        if (installed) {
            return <Typography variant="body2">ShareFrame ist bereits installiert.</Typography>;
        }
        if (canPrompt || showIosHint) {
            return (
                <FormActions>
                    <Button
                        variant="contained"
                        startIcon={<InstallMobileIcon />}
                        onClick={canPrompt ? promptInstall : () => setIosDialogOpen(true)}
                    >
                        App installieren
                    </Button>
                </FormActions>
            );
        }
        return (
            <Typography variant="body2">
                Dein Browser bietet die Installation hier nicht an. Nutze dafür das Browsermenü oder öffne ShareFrame in Chrome, Edge oder Safari.
            </Typography>
        );
    };

    return (
        <SettingsSection
            title="App installieren"
            description="Installiere ShareFrame auf deinem Gerät und starte es wie eine App vom Home-Bildschirm oder Desktop."
        >
            {renderAction()}
            <IosInstallDialog open={iosDialogOpen} onClose={() => setIosDialogOpen(false)} />
        </SettingsSection>
    );
};

export default Install;

import { Box, Link, Switch, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import SettingsSection from '@/common/components/settings/settingsSection';
import { getPrivacyPolicyUrl } from '@/assets/endpoints/app/legalEndpoints';

const PrivacySettings = () => (
    <SettingsSection
        title="Cookies"
        description={
            <>
                ShareFrame verwendet nur Cookies und lokale Speicherungen, die für die Nutzung nötig sind, und kein Tracking. Mehr dazu erfährst du in der{' '}
                <Link component={RouterLink} to={"/" + getPrivacyPolicyUrl()}>Datenschutzerklärung</Link>.
            </>
        }
    >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box>
                <Typography variant="body1">Notwendige Cookies</Typography>
                <Typography variant="body2" color="text.secondary">
                    Notwendige Cookies werden nur von uns geschrieben und gelesen. Sie halten dich angemeldet und schützen dein Konto. Daher können sie nicht deaktiviert werden.
                </Typography>
            </Box>
            <Switch checked disabled slotProps={{ input: { 'aria-label': 'Notwendige Cookies' } }} />
        </Box>
    </SettingsSection>
);

export default PrivacySettings;

import { Box, Switch, Typography } from '@mui/material';
import SettingsSection from '@/common/components/settings/settingsSection';

const PrivacySettings = () => (
    <SettingsSection
        title="Cookies"
        description="Mehr über die auf shareframe.de verwendeten Cookies erfährst du in den Datenschutzbestimmungen. Für weitere Informationen kontaktiere uns einfach."
    >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box>
                <Typography variant="body1">Notwendige Cookies</Typography>
                <Typography variant="body2" color="text.secondary">
                    Notwendige Cookies werden nur von uns geschrieben und gelesen. Diese Cookies garantieren ein reibungsloses Funktionieren der Website und sind für dieses unabdingbar. Daher können notwendige Cookies nicht deaktiviert werden.
                </Typography>
            </Box>
            <Switch checked disabled slotProps={{ input: { 'aria-label': 'Notwendige Cookies' } }} />
        </Box>
    </SettingsSection>
);

export default PrivacySettings;

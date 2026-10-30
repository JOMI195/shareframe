import React from 'react';
import { Box, Button, Container, Link, Stack, Typography } from '@mui/material';
import Logo from '../../logo';
import StandaloneTheme from '../standaloneTheme';
import { clearLocalDataAndReload } from '@/common/utils/localData';

const FinalError: React.FC = () => (
    <StandaloneTheme>
        <Container component="main" maxWidth="sm" sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ mb: 5, width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Logo
                    darkLogoSrc="/logo-dark-full-shareframe.svg"
                    lightLogoSrc="/logo-light-full-shareframe.svg"
                    clickable={false}
                    marginRight={0}
                    maxWidth={300}
                    alt="ShareFrame"
                />
            </Box>
            <Stack spacing={2}>
                <Typography variant="h5" component="h1" color="error">
                    Kritischer Fehler
                </Typography>
                <Typography>
                    ShareFrame ist wiederholt auf einen Fehler gestoßen. Lade die Seite neu. Hilft das nicht, lösche die lokalen Daten dieser Seite. Dein Konto und deine Fotos bleiben erhalten, eventuell musst du dich danach neu anmelden.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button variant="contained" onClick={() => window.location.reload()}>
                        Neu laden
                    </Button>
                    <Button variant="outlined" color="error" onClick={() => void clearLocalDataAndReload()}>
                        Lokale Daten löschen
                    </Button>
                </Stack>
                <Typography sx={{ color: 'text.secondary' }}>
                    Besteht der Fehler weiter, schreib uns an{' '}
                    <Link href="mailto:info@shareframe.de">info@shareframe.de</Link>.
                </Typography>
            </Stack>
        </Container>
    </StandaloneTheme>
);

export default FinalError;

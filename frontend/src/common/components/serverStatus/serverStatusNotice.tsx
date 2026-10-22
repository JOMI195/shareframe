import { useEffect } from 'react';
import { Alert, CircularProgress, Dialog, Slide, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useAppSelector } from '@/store';
import { getServerStatus } from '@/store/ui/serverStatus/serverStatus.slice';
import { getHealthUrl } from '@/assets/endpoints/api/appEndpoints';
import http from '@/services/httpService';
import { retryDelay } from '@/services/serverStatus';
import Logo from '../logo';
import { StackedSnackbar } from '../snackbars/snackbarStack';

const ServerStatusNotice: React.FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { unavailable, maintenance } = useAppSelector(getServerStatus);

  // Polls only during an outage; the interceptor marks the server available again, which ends the loop.
  useEffect(() => {
    if (!unavailable) return;
    let active = true;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timer = setTimeout(async () => {
        await http.get(getHealthUrl()).catch(() => undefined);
        attempt += 1;
        if (active) schedule();
      }, retryDelay(attempt));
    };
    schedule();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [unavailable]);

  return (
    <>
      <Dialog
        fullScreen
        open={unavailable && maintenance}
        aria-labelledby="maintenance-title"
        slotProps={{ paper: { sx: { backgroundColor: 'background.default', backgroundImage: 'none' } } }}
      >
        <Stack
          spacing={2}
          sx={{
            minHeight: '100%',
            px: 2,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Logo
            darkLogoSrc="/frame-3d-no-data.svg"
            lightLogoSrc="/frame-3d-no-data.svg"
            clickable={false}
            marginRight={0}
            maxWidth={isSmallScreen ? 150 : 300}
          />
          <Typography id="maintenance-title" variant="h2">Wartung</Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', maxWidth: 520 }}>
            ShareFrame wird gerade gewartet und ist bald wieder da. Die Seite geht danach von selbst weiter.
          </Typography>
        </Stack>
      </Dialog>

      {/* No onClose: it stays until the server is back. */}
      <StackedSnackbar open={unavailable && !maintenance} slots={{ transition: Slide }}>
        <Alert
          elevation={6}
          severity="warning"
          icon={<CircularProgress color="inherit" size={20} />}
          sx={{ width: '100%' }}
        >
          ShareFrame ist gerade nicht erreichbar, neuer Versuch läuft
        </Alert>
      </StackedSnackbar>
    </>
  );
};

export default ServerStatusNotice;

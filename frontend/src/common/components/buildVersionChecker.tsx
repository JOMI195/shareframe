import { useEffect, useState } from 'react';
import { Button, Alert, useTheme, useMediaQuery } from '@mui/material';
import { getVersionFileUrl } from '@/assets/endpoints/app/appEndpoints';
import { reloadOnce } from '@/common/utils/reloadOnce';
import { StackedSnackbar } from './snackbars/snackbarStack';

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const FORCED_RELOAD_KEY = 'forced-reload-version';

type DeployedVersion = { version: string; force: boolean };

// Written by the frontend image; dev servers have none, which reads as "nothing to report".
const fetchDeployedVersion = async (): Promise<DeployedVersion | null> => {
  try {
    const response = await fetch(new URL(getVersionFileUrl(), window.location.href), { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    if (typeof data?.version !== 'string' || !data.version) return null;
    return { version: data.version, force: data.force === true };
  } catch {
    return null;
  }
};

const BuildVersionChecker: React.FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [deployedVersion, setDeployedVersion] = useState<string | null>(null);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);

  const frontendVersion = import.meta.env.VITE_APP_BUILD_VERSION;

  const open = Boolean(deployedVersion) && Boolean(frontendVersion)
    && deployedVersion !== frontendVersion
    && deployedVersion !== dismissedVersion;

  useEffect(() => {
    let active = true;

    const checkVersion = async () => {
      const deployed = await fetchDeployedVersion();
      if (!active || !deployed) return;
      if (deployed.force && frontendVersion && deployed.version !== frontendVersion
        && reloadOnce(FORCED_RELOAD_KEY, deployed.version)) return;
      setDeployedVersion(deployed.version);
    };

    checkVersion();
    window.addEventListener('focus', checkVersion);
    const intervalId = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    return () => {
      active = false;
      window.removeEventListener('focus', checkVersion);
      clearInterval(intervalId);
    };
  }, [frontendVersion]);

  const handleClose = (_event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setDismissedVersion(deployedVersion);
  };

  const handleReload = () => {
    setDismissedVersion(deployedVersion);
    window.location.reload();
  };
  return (
    <StackedSnackbar
      open={open}
      onClose={handleClose}
    >
      <Alert
        severity="info"
        variant="filled"
        action={
          <Button
            variant='outlined'
            color="inherit"
            size="small"
            onClick={handleReload}
            sx={{
              ml: !isSmallScreen ? 1 : 0,
            }}
          >
            Jetzt neu laden
          </Button>
        }
        onClose={handleClose}
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
        Eine neue Version von Shareframe ist verfügbar! Bitte lade diese Seite erneut.
      </Alert>
    </StackedSnackbar>
  );
};

export default BuildVersionChecker;

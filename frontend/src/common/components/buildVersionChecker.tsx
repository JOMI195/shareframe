import { useEffect, useState } from 'react';
import { Button, Snackbar, Alert, useTheme, useMediaQuery } from '@mui/material';
import { getAppVersion } from '@/store/entities/app/app.slice';
import { fetchAppVersion } from '@/store/entities/app/app.actions';
import { useAppDispatch, useAppSelector } from '@/store';

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

const BuildVersionChecker: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const backendVersion = useAppSelector(getAppVersion);
  const [open, setOpen] = useState<boolean>(false);

  const frontendVersion = import.meta.env.VITE_APP_BUILD_VERSION;

  useEffect(() => {
    const getAppVersion = () => {
      dispatch(fetchAppVersion());
    };

    window.addEventListener('focus', getAppVersion);

    return () => {
      window.removeEventListener('focus', getAppVersion);
    };
  }, []);

  useEffect(() => {
    dispatch(fetchAppVersion());

    const intervalId = setInterval(() => {
      dispatch(fetchAppVersion());
    }, VERSION_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [dispatch]);

  useEffect(() => {
    if (!backendVersion || !frontendVersion) return;

    if (backendVersion !== frontendVersion) {
      setOpen(true);
    }
  }, [backendVersion, frontendVersion]);

  const handleClose = (_event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleReload = () => {
    setOpen(false);
    window.location.reload();
  };
  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        width: isSmallScreen ? '90%' : 'auto',
        bottom: 16
      }}
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
    </Snackbar>
  );
};

export default BuildVersionChecker;

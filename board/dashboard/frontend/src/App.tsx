import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import Authentication from './main/authentication/authentication';
import Dashboard from './main/dashboard/dashboard';
import MainLayout from './common/components/layout/layout';
import { useAppDispatch } from './store';
import { startContinuousStatusCheck } from './store/slideshowStatus/slideshowStatus.Slice';
import { initializeTimerFromStorage } from './store/slideshowActionRestrictTimer/slideshowActionRestrictTimer.Slice';
import { addAlertSnackbar, addLoadingSnackbar, removeLoadingSnackbar } from './store/snackbars/snackbars.Slice';
import uuid from 'react-uuid';
import { IServerResponse } from './types';
import Logo from './common/components/logo';

function App(): React.ReactElement {
  const dispatch = useAppDispatch();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const stopStatusCheck = dispatch(startContinuousStatusCheck());

    return () => {
      stopStatusCheck();
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(initializeTimerFromStorage());
  }, [dispatch]);


  useEffect(() => {
    // Check if user is already authenticated
    fetch('/api/auth/check-auth')
      .then(response => response.json())
      .then(data => {
        setIsAuthenticated(data.authenticated);
        setLoading(false);
      })
      .catch(error => {
        console.error('Auth check error:', error);
        setLoading(false);
      });
  }, []);

  const handleLogin = async (otp: string): Promise<void> => {
    const snackbarId = uuid();
    try {
      dispatch(addLoadingSnackbar(
        snackbarId,
        'Authentifizierung des OTP. Bitte habe einen kurzen Moment Gedult',
      ));
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
      });

      const data: IServerResponse = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        dispatch(addAlertSnackbar(
          uuid(),
          'Authentifizierung erfolgreich',
          'success'
        ));
      } else {
        dispatch(addAlertSnackbar(
          uuid(),
          data.message ? data.message : 'Authentifizierung fehlgeschlagen',
          'error'
        ));
      }
    } catch (error) {
      dispatch(addAlertSnackbar(
        uuid(),
        'Authentifizierung fehlgeschlagen',
        'error'
      ));
    } finally {
      dispatch(removeLoadingSnackbar(snackbarId));
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setIsAuthenticated(false);
      dispatch(addAlertSnackbar(
        uuid(),
        'Erfolgreich ausgeloggt',
        'success'
      ));
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection={"column"}
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Logo
          darkLogoSrc="/logo-dark-full-shareframe.svg"
          lightLogoSrc="/logo-light-full-shareframe.svg"
          maxWidth={350}
          marginRight={0}
          clickable={false}
        />
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MainLayout onLogout={handleLogout}>
      <Box sx={{ width: '100%' }}>
        {isAuthenticated ? (
          <Dashboard />
        ) : (
          <Authentication onLogin={handleLogin} />
        )}
      </Box>
    </MainLayout>
  );
}

export default App;
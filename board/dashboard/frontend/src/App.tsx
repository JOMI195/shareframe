import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import Authentication from './main/authentication/authentication';
import Dashboard from './main/dashboard/dashboard';
import { useAppDispatch, useAppSelector } from './store';
import { initializeTimersFromStorage } from './store/multiTimer/multiTimer.Slice';
import {
  checkAuthStatusThunk,
  selectAuth
} from './store/auth/auth.Slice';
import Logo from './common/components/logo';

const App = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(selectAuth);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    dispatch(checkAuthStatusThunk());
    setInitialLoad(false);
  }, [dispatch]);

  useEffect(() => {
    dispatch(initializeTimersFromStorage());
  }, [dispatch]);

  if (initialLoad) {
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
    <Box sx={{ width: '100%' }}>
      {isAuthenticated ? (
        <Dashboard />
      ) : (
        <Authentication />
      )}
    </Box>
  );
}

export default App;
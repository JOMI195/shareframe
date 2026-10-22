import { RouterProvider } from 'react-router';
import Routing from './routes/routing';
import { ColorThemeProvider } from './context/colorTheme/colorThemeContext';
import { CssBaseline } from '@mui/material';
import { SnackbarStackProvider } from './common/components/snackbars/snackbarStack';

const App = () => {
  return (
    <ColorThemeProvider>
      <CssBaseline enableColorScheme />
      <SnackbarStackProvider>
        <RouterProvider router={Routing} />
      </SnackbarStackProvider>
    </ColorThemeProvider>
  );
};

export default App;

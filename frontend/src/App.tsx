import { RouterProvider } from 'react-router-dom';
import Routing from './routes/routing';
import { ColorThemeProvider } from './context/colorTheme/colorThemeContext';
import { CssBaseline } from '@mui/material';
import LoadingFallback from './common/components/loadingFallback';

const App = () => {
  return (
    <ColorThemeProvider>
      <CssBaseline enableColorScheme />
      <RouterProvider
        router={Routing}
        fallbackElement={<LoadingFallback />}
      />
    </ColorThemeProvider>
  );
};

export default App;

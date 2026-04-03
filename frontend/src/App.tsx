import { RouterProvider } from 'react-router';
import Routing from './routes/routing';
import { ColorThemeProvider } from './context/colorTheme/colorThemeContext';
import { CssBaseline } from '@mui/material';

const App = () => {
  return (
    <ColorThemeProvider>
      <CssBaseline enableColorScheme />
      <RouterProvider router={Routing} />
    </ColorThemeProvider>
  );
};

export default App;

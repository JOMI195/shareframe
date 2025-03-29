import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ColorThemeProvider } from './context/colorTheme/colorThemeContext.tsx'
import { CssBaseline } from '@mui/material'
import '@fontsource/inter'
import Snackbars from './common/components/snackbars/snackbars.tsx'
import { Provider } from 'react-redux'
import { store } from './store/index.ts'
import { PiConnectionProvider } from './context/piConnection/piConnectionContext.tsx'
import MainLayout from './common/components/layout/layout.tsx'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <ColorThemeProvider>
      <CssBaseline enableColorScheme />
      <PiConnectionProvider>
        <Snackbars>
          <MainLayout>
            <App />
          </MainLayout>
        </Snackbars>
      </PiConnectionProvider>
    </ColorThemeProvider>
  </Provider>
)

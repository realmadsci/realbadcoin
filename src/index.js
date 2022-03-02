import React from 'react';
import ReactDOM from 'react-dom';

import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import App from './App';

function ThemeWrapper() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
        typography: {
          hexblob: {
            fontFamily: ['Roboto Mono', 'Consolas', 'Courier New'].join(','),
            overflowWrap: "break-word",
            textTransform: "uppercase",
          }
        },
      }),
    [prefersDarkMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}


ReactDOM.render(
  <React.StrictMode>
    <ThemeWrapper />
  </React.StrictMode>,
  document.getElementById('root')
);

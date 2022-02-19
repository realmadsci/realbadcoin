import * as React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Paper from '@mui/material/Paper';

import EccApp from './EccDemo';
import PeerApp from './PeerDemo';

function App() {
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
      <Paper>
        <EccApp />
      </Paper>
      <Paper>
        <PeerApp />
      </Paper>
    </ThemeProvider>
  );
}

export default App;

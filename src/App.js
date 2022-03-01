import * as React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Paper from '@mui/material/Paper';

import EccApp from './EccDemo';
import PeerApp from './PeerDemo';
import BlockView from './BlockView';
import TransactionView from './TransactionView';

import {
  RealBadCoinTransfer,
  RealBadNftMint,
  RealBadNftTransfer,
  RealBadTransaction,
  RealBadBlock
} from './util/RealBadCoin.tsx';

function makeBlock() {
  let block = new RealBadBlock();
  // Pick an easy target to save testing time, but hard enough that
  // it isn't likely to happen by accident.
  block.difficulty = 256**2;
  block.rewardDestination = "FE39C1887F08F1B7CFB9B6034AC01F6DD06F721FE370D3CD1F7621045387C230".toLowerCase();
  block.tryToSeal(1e6);
  return block;
}

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
      <Paper>
        <BlockView block={makeBlock()} />
      </Paper>
      <Paper>
        <TransactionView />
      </Paper>
    </ThemeProvider>
  );
}

export default App;

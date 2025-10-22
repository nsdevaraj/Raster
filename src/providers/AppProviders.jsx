import { ThemeProvider } from '@emotion/react';
import { theme } from '@styles/theme.js';

export function AppProviders({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

export const theme = {
  colors: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceAlt: '#0b192f',
    primary: '#38bdf8',
    primaryHover: '#0ea5e9',
    border: '#1e293b',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    accent: '#f97316',
  },
  spacing: (factor = 1) => `${0.25 * factor}rem`,
  radii: {
    sm: '4px',
    md: '8px',
    lg: '16px',
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    code: '"Roboto Mono", ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  shadows: {
    sm: '0 1px 2px rgba(15, 23, 42, 0.3)',
    md: '0 10px 25px rgba(15, 23, 42, 0.45)',
    inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  },
  layout: {
    headerHeight: '64px',
    sidebarWidth: '320px',
    maxWidth: '1200px',
  },
};

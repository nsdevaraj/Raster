# Raster to SVG Studio

A modern web application scaffold for converting raster images to optimized SVGs. This project is built with [Vite](https://vitejs.dev/), [React](https://react.dev/), and a set of core libraries that power routing, state management, styling, and raster tracing.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

### Available Scripts

- `npm run dev` – start the development server.
- `npm run build` – create a production build in the `dist/` directory.
- `npm run preview` – locally preview a production build.
- `npm run lint` – run ESLint against all JavaScript and JSX files.
- `npm run format` – format the codebase with Prettier.

## Technology Stack

- **React + Vite** – fast development server and production build tooling.
- **React Router** – client-side routing.
- **Zustand** – lightweight global state store for conversion settings and trace results.
- **Emotion** – themeable styling primitives and global styles.
- **potrace-wasm** – WebAssembly-powered raster-to-SVG tracing engine.
- **SVGO** – optimization pipeline to refine generated SVG markup.
- **clsx** – conditional class name helper.

## Project Structure

```
├── src
│   ├── components
│   │   ├── layout          # App shell, header, main content, sidebar
│   │   └── panels          # Upload, settings, and preview panels
│   ├── hooks               # Custom hooks (e.g., tracing workflow)
│   ├── providers           # Application-level providers (theme, etc.)
│   ├── routes              # Route configuration and views
│   ├── store               # Zustand global store definitions
│   ├── styles              # Global CSS and theme tokens
│   ├── utils               # Future utility helpers
│   └── workers             # Potrace + SVGO tracing orchestration
├── index.html              # Vite entry point
├── vite.config.js          # Vite configuration with module aliases
├── .eslintrc.cjs           # ESLint configuration (React + Prettier)
├── .prettierrc             # Prettier formatting preferences
└── package.json            # Dependencies and scripts
```

## Development Notes

- The tracing workflow lives in `src/hooks/useTraceWorker.js` and delegates to `src/workers/potraceWorker.js` where Potrace and SVGO are orchestrated.
- The global theme is defined in `src/styles/theme.js` and provided via Emotion's `ThemeProvider` in `src/providers/AppProviders.jsx`.
- Routing is set up in `src/routes/AppRoutes.jsx`, with an initial `Home` view that wires together upload, settings, and vector preview panels.

This scaffold is ready for further feature development—implement additional panels, extend the tracing worker, or integrate collaboration features as needed.

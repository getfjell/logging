# Fjell Logging Documentation Website

This directory contains the documentation website for @fjell/logging, built with React and Vite.

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:3002`

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## Structure

- `src/` - React application source code
  - `App.tsx` - Main application component
  - `App.css` - Application styles
  - `main.tsx` - Application entry point
  - `test/` - Test files
- `public/` - Static assets served by the site
- `dist/` - Built site output (generated)

## Content

The website automatically loads content from:

- Main README.md from the library root
- Examples README.md from the examples directory
- Example TypeScript files from the examples directory
- Package.json for version information

Content is fetched at runtime and falls back to built-in content if files are unavailable.

## Deployment

The site is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to the main branch. See `.github/workflows/deploy-docs.yml` for the deployment configuration.

## Customization

To customize the site content:

1. Update the `documentSections` array in `App.tsx` to modify navigation
2. Update fallback content in the `getFallbackContent` function
3. Modify styles in `App.css`
4. Update the site title and metadata in `index.html`

# Rare Visual SEO Agent

A powerful SEO and visual content generation tool built with React and Tailwind CSS.

## Features

- **Article Generator**: Create SEO-optimized content.
- **Image Studio**: Generate visuals for your content.
- **Research Tool**: Analyze keywords and competitors.
- **Local SEO**: Optimize for local search.
- **Chat Assistant**: AI-powered assistance.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

### Build

Build for production:

```bash
npm run build
```

The output will be in the `dist` directory.

## Deployment

This project is configured for **GitHub Pages**.

1. Push changes to the `main` branch.
2. The GitHub Action will automatically build and deploy.
3. Enable GitHub Pages in your repository settings:
   - Go to **Settings** > **Pages**
   - Source: **Deploy from a branch** (Action will handle this, actually for custom action source should be "GitHub Actions")
   - *Correction*: Since we use a custom workflow `deploy.yml` that uses `deploy-pages`, you should go to **Settings** > **Pages** and switch Source to **GitHub Actions**.

## Technologies

- React 19
- Tailwind CSS
- Vite
- Lucide React
- Google GenAI

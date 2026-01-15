# Curbside - Professional-grade skin intelligence

A Next.js application for AI-powered skin analysis and dermatology diagnostics.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the landing page.

## Features

- **Landing Page**: High-contrast typography with split-screen hero layout
- **Dashboard**: Clinical Hub with AI analysis and scan history
- **Interactive Components**: Before/After slider, Diagnostic Canvas with scanning animations
- **State Management**: Zustand for patient info, React Query for data fetching
- **Error Handling**: Graceful degradation with quality alerts

## Project Structure

- `/app` - Next.js app router pages
- `/components` - React components (UI and custom components)
- `/hooks` - Custom React hooks (useAnalysis, useSkinHistory)
- `/store` - Zustand state management
- `/types` - TypeScript type definitions
- `/lib` - Utility functions

## Technologies

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI
- Zustand
- TanStack Query (React Query)
- Framer Motion
- jsPDF

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` - Starts Vite development server with HMR
- **Build for production**: `npm run build` - TypeScript compilation + Vite build
- **Lint code**: `npm run lint` - Run ESLint on all files
- **Preview production build**: `npm run preview` - Preview the production build locally

## Project Architecture

This is a React + TypeScript + Vite application with shadcn/ui component library integration.

### Tech Stack
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **State Management**: React hooks (useState, etc.)
- **Linting**: ESLint with TypeScript, React Hooks, and React Refresh plugins

### Key Configuration Files
- `vite.config.ts`: Vite configuration with React and Tailwind plugins, path aliases (`@` → `./src`)
- `components.json`: shadcn/ui configuration (New York style, TypeScript, Lucide icons)
- `eslint.config.js`: ESLint setup with TypeScript and React rules
- `tsconfig.app.json`, `tsconfig.json`, `tsconfig.node.json`: TypeScript configurations

### File Structure
- `src/App.tsx`: Main application component
- `src/main.tsx`: React application entry point
- `src/lib/utils.ts`: Utility functions (includes `cn` for class merging)
- `src/index.css`: Global CSS with Tailwind directives
- Path aliases: `@` maps to `./src`, `@/components`, `@/lib/utils`, `@/components/ui`, `@/hooks`

### shadcn/ui Integration
- Components are configured for the "new-york" style
- Base color: zinc with CSS variables enabled
- Icon library: Lucide React
- Add components with: `npx shadcn@latest add [component-name]`
# Ready to Retire? - Retirement Readiness Assessment

## Overview

A free web application that provides CFP-designed retirement readiness self-assessments. The application collects structured retirement inputs, runs Monte Carlo simulations entirely in the browser, and generates personalized "Retirement Readiness Brief" reports.

This is an educational product that does NOT provide personalized financial advice. It encodes the judgment, experience, and mental models of a Certified Financial Planner (CFP) when evaluating retirement readiness.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend-Only Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter for client-side routing
- **State Management**: React Context (AssessmentProvider) for in-memory assessment state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Simulation**: Monte Carlo engine runs entirely in the browser (shared/simulation.ts)

### Server (Development Only)
- Express server exists only to serve the Vite dev server and static files in production
- No API routes, no database, no authentication
- The server has no business logic - it's just a static file server

### Core Business Logic (Client-Side)
- **Simulation Engine**: Monte Carlo simulation in `shared/simulation.ts` runs 3,000+ scenarios in the browser
- **Ruleset Configuration**: Owner-editable assumptions in `shared/ruleset.ts` for LTC costs, healthcare, allocation assumptions, and asset midpoints
- **Validation**: Zod schemas in `shared/schema.ts` for type-safe intake data validation

### Application Flow
1. Landing page allows users to start a free assessment (no login required)
2. Multi-step intake form (7 steps) collects retirement planning data
3. Browser runs Monte Carlo simulation on final step submission
4. Results page displays verdict, probability, risks, and recommendations

### Key Design Decisions
- **No Authentication**: No login/signup required - assessment is completely anonymous
- **No Database**: All data lives in React state during the session
- **Client-Side Simulation**: Monte Carlo engine runs in the browser for privacy and simplicity
- **GitHub-Exportable**: Can be deployed as a static site with minimal server

## External Dependencies

### UI Framework
- Radix UI primitives for accessible components
- Tailwind CSS for styling
- Google Fonts: Inter (primary), DM Sans (headings)

### Build Tools
- Vite for frontend development and bundling
- esbuild for server compilation
- TypeScript for type checking

## Recent Changes (February 2026)

### Backend Removal
- Removed all API routes, database, sessions, and authentication
- Removed PostgreSQL/Drizzle ORM dependencies from business logic
- Removed Google Sheets and Kit (ConvertKit) integrations
- Removed RegisterPage, LoginPage, and auth hook
- Moved Monte Carlo simulation from server to shared/simulation.ts (runs in browser)
- Added AssessmentProvider context for client-side state management
- Simplified routes: / (landing), /intake (form), /results (results)
- Server now only serves static files (no API endpoints)

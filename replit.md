# Can I Retire Yet? - Retirement Readiness Assessment

## Overview

A paid, gated web application that provides CFP-designed retirement readiness self-assessments. The application collects structured retirement inputs, applies CFP-style judgment and risk weighting, runs Monte Carlo simulations, and generates personalized "Retirement Readiness Brief" reports.

This is an educational product that does NOT provide personalized financial advice. It encodes the judgment, experience, and mental models of a Certified Financial Planner (CFP®) when evaluating retirement readiness.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens following Carbon Design System principles
- **Design Philosophy**: Professional, calm interface that reduces financial anxiety with clear information hierarchy

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **Build System**: esbuild for server bundling, Vite for client

### Data Layer
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions and Zod validation schemas
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)

### Core Business Logic
- **Simulation Engine**: Monte Carlo simulation in `server/simulation.ts` runs 3,000+ scenarios
- **Ruleset Configuration**: Owner-editable assumptions in `shared/ruleset.ts` for LTC costs, healthcare, allocation assumptions, and asset midpoints
- **Validation**: Zod schemas for type-safe intake data validation

### Application Flow
1. Checkout page creates assessment session (Stripe integration placeholder)
2. Multi-step intake form (7 steps) collects retirement planning data
3. Server runs Monte Carlo simulation on submission
4. Results page displays verdict, probability, risks, and recommendations

### Key Design Decisions
- **No User Accounts**: Magic-link access only for simplicity
- **Pay-First Flow**: Assessment created after payment verification
- **Shared Types**: TypeScript types shared between client and server via `@shared/` alias
- **Progressive Save**: Intake form saves progress after each step

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database access
- connect-pg-simple for session storage

### Payment Processing
- Stripe integration (placeholder in MVP, webhooks configured)

### UI Framework
- Radix UI primitives for accessible components
- Tailwind CSS for styling
- Google Fonts: Inter (primary), DM Sans (headings)

### Build Tools
- Vite for frontend development and bundling
- esbuild for server compilation
- TypeScript for type checking

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key

## Recent Changes (January 2026)

### Bug Fixes Applied
1. **JSON Response Parsing**: Fixed `apiRequest()` calls in CheckoutPage and IntakePage to properly parse JSON responses using `.json()`
2. **Schema Default Values**: Added sensible defaults for optional numeric/boolean fields (flexibility_score, has_mortgage, spending_confidence, etc.) to prevent validation errors
3. **Initial State Defaults**: IntakePage now initializes state with default values for required fields
4. **Cache Invalidation**: Submit mutation now awaits cache invalidation before redirecting to ensure ResultsPage receives fresh data
5. **State Merging**: LoadAssessment useEffect now merges loaded data with defaults instead of replacing them

### Application Status
- All 7 intake wizard steps functional
- Monte Carlo simulation (3,000 trials) working
- Results page displays verdict, probability, risks, and recommendations
- PostgreSQL persistence operational
- Stripe integration placeholder in place (MVP skips payment)
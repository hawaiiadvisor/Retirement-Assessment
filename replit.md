# Ready to Retire? - Retirement Readiness Assessment

## Overview

A free web application that provides CFP®-designed retirement readiness self-assessments. The application collects structured retirement inputs, applies CFP®-style judgment and risk weighting, runs Monte Carlo simulations, and generates personalized "Retirement Readiness Brief" reports.

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
1. Landing page allows users to start a free assessment
2. Multi-step intake form (7 steps) collects retirement planning data
3. Server runs Monte Carlo simulation on submission
4. Results page displays verdict, probability, risks, and recommendations

### Authentication
- **User Accounts**: Email/password registration and login
- **Password Security**: bcrypt with 12 rounds for password hashing
- **Session Management**: express-session with connect-pg-simple for PostgreSQL-backed sessions
- **Session Config**: httpOnly cookies, 7-day expiry, secure in production

### Key Design Decisions
- **User Accounts**: Email/password authentication (replaced magic-link access)
- **Free Access**: No payment required - assessment is completely free
- **Shared Types**: TypeScript types shared between client and server via `@shared/` alias
- **Progressive Save**: Intake form saves progress after each step
- **Assessment Ownership**: Assessments linked to user accounts via userId foreign key

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database access

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
- `GOOGLE_SHEET_ID`: (Optional) Google Sheet ID for assessment data. Auto-creates if not set.
- `KIT_API_SECRET`: Kit (ConvertKit) API secret for subscriber management
- `KIT_FORM_ID`: Kit form ID to subscribe new users to
- `KIT_TAG_ID`: (Optional) Kit tag ID to apply when assessment is completed

## Recent Changes (February 2026)

### Paywall Removal
- Removed Stripe integration entirely (stripeClient.ts, webhookHandlers.ts, seed-products.ts deleted)
- Removed checkout flow and payment verification
- Landing page now creates assessments directly for free
- Removed CheckoutSuccessPage
- Cleaned up server/index.ts to remove Stripe initialization and webhook handling
- Updated routes to use simple POST /api/assessments for assessment creation
- Updated replit.md to reflect free model

### Email/Password Authentication
- Added user_accounts table with email and hashed password fields
- Implemented registration, login, logout, and session check endpoints
- Built RegisterPage and LoginPage with form validation
- Updated Header to show user email and logout button when authenticated
- Linked assessments to user accounts via userId foreign key
- Removed old magic-link access flow (AccessPage, AccessTokenPage deleted)

### Google Sheets & Kit Integration
- Added Google Sheets integration to automatically log completed assessments
- Auto-creates "Retirement Assessment Responses" spreadsheet if GOOGLE_SHEET_ID not set
- Added Kit (ConvertKit) integration to add subscribers on registration
- Kit tagging on assessment completion (optional via KIT_TAG_ID)
- Both integrations run in background and won't block the user experience

### Application Status
- All 7 intake wizard steps functional
- Monte Carlo simulation (3,000 trials) working
- Results page displays verdict, probability, risks, and recommendations
- PostgreSQL persistence operational
- Free access - no payment required
- Google Sheets data export on assessment completion
- Kit subscriber sync on user registration

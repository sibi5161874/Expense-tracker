# Finance Tracker SaaS

A comprehensive personal finance and investment tracking application built with Next.js, Supabase, and TypeScript.

## Features

- **Transaction Management**: Income/expense/transfer tracking, categories, budgets, recurring transactions, calendar view (web)
- **Investment Portfolio**: Log and monitor stock/mutual fund investments, live price refresh, weighted-average-cost, stock fundamentals (P/E, margins, market cap, beta, dividend yield), portfolio-vs-Nifty-50 benchmark, passive income tracker, tax-loss harvesting (web)
- **13 asset classes**: Fixed Deposits, Recurring Deposits, PPF, NPS, SSY, SGB, NSC, Gold, ULIP, Real Estate, Vehicles, EPF, Loans/Liabilities
- **14 reports** (+ a combined Overall Report), exported as PDF/Excel — table-driven via `jspdf-autotable`, never a DOM screenshot
- **Goal Tracking**: Set and track financial goals with progress visualization
- **Cashbook**: Manage personal loans and informal lending/borrowing
- **Bank/broker CSV import**: confidence-tiered institution registry with balance self-reconciliation
- **Multi-currency**: FX-converted account balances, INR base
- **Financial calculator suite**: Basic, SIP, Stock Averaging, Lumpsum, P&L
- **Monetization**: Free / 30-day trial / lifetime tiers via Razorpay, gated through a single feature-flag config
- **Authentication**: Email/password and Google OAuth authentication

Mobile trails web significantly — see [`MOBILE_ROADMAP.md`](./MOBILE_ROADMAP.md) for the gap
and a phased plan to close it.

## Tech Stack

- **Web**: Next.js 16 (App Router), React, TypeScript
- **Mobile**: Expo (React Native) + Expo Router — feature screens are being ported over from the web app module by module
- **UI**: TailwindCSS, shadcn/ui components, Recharts
- **Backend**: Supabase (PostgreSQL, Auth via `@supabase/ssr`, RLS)
- **State Management**: TanStack Query
- **Forms**: React Hook Form with Zod validation
- **Payments**: Razorpay
- **Email**: Resend
- **Monorepo**: Turborepo + pnpm workspaces, shared package at `packages/shared`

## Project Structure

```
expense_tracker/
├── apps/
│   ├── web/                 # Next.js web application
│   │   ├── src/
│   │   │   ├── app/         # Next.js App Router pages
│   │   │   ├── components/  # React components
│   │   │   ├── contexts/    # React contexts (Auth)
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   └── lib/         # Supabase clients (browser/server/middleware), providers
│   │   └── .env.local       # Environment variables (not committed)
│   └── mobile/               # Expo app (Expo Router)
│       ├── app/              # File-based routes: (auth)/, (app)/
│       └── src/               # components/common, hooks, lib
├── packages/
│   └── shared/              # Shared package for monorepo
│       ├── src/
│       │   ├── types/       # Database types (regenerate via supabase gen types)
│       │   ├── queries/     # Database query functions (take a Supabase client param)
│       │   ├── schemas/     # Zod validation schemas
│       │   ├── logic/       # Business logic calculations (no DATA_MODEL.md exists yet — known gap)
│       │   └── utils/       # Utility functions (formatINR, date helpers)
│       └── package.json
├── supabase/
│   └── migrations/          # Database schema migrations — the only source of schema truth
└── package.json            # Root package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm package manager
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/expense_tracker.git
   cd expense_tracker
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example apps/web/.env.local
   ```
   
   Add your Supabase credentials to `apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   Get these values from your Supabase project dashboard:
   - Go to Settings → API
   - Copy Project URL and Anon Public Key

4. **Configure Supabase Authentication**
   
   - Enable Email provider in Supabase Dashboard → Authentication → Providers
   - Enable Google OAuth provider and add OAuth credentials
   - Set redirect URL: `https://your-project-ref.supabase.co/auth/v1/callback`

5. **Run database migrations**
   
   If using Supabase CLI:
   ```bash
   supabase db push
   ```

   Or apply migrations manually from the Supabase dashboard.

6. **Start the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Running the Apps

This is a Turborepo monorepo with two frontends (`apps/web` and `apps/mobile`) sharing
business logic/types from `packages/shared`. Install once at the repo root (`pnpm install`)
before running either app.

### Web app (Next.js)

Requires `apps/web/.env.local` — see [Environment Variables](#environment-variables) above.

```bash
# from the repo root — runs every app/package's dev script via Turborepo
pnpm dev

# or just the web app on its own
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000). Other useful commands (repo root or
`--filter web`): `pnpm build`, `pnpm lint`, `pnpm typecheck`.

### Mobile app (Expo / React Native)

The mobile app is a separate Expo project at `apps/mobile` — screens are being ported
over module by module, matching the web app's design system and feature set.

1. **Set up environment variables** — create `apps/mobile/.env.local` (see
   `apps/mobile/.env.example`) with your Supabase project's client-safe values:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
   (Same Supabase project as the web app — these are the public URL/anon key, safe to
   share between both frontends.)

2. **Start the Expo dev server**
   ```bash
   pnpm --filter mobile start
   ```
   This opens the Expo Dev Tools in your terminal with a QR code.

3. **Open the app** — pick whichever matches your setup:
   ```bash
   pnpm --filter mobile android   # Android emulator or connected device
   pnpm --filter mobile ios       # iOS simulator (macOS only)
   pnpm --filter mobile web       # runs the Expo app in a browser tab
   ```
   Or scan the QR code from `pnpm --filter mobile start` with the **Expo Go** app on
   your phone (fastest way to try it on a real device, no emulator/simulator needed).

   Running an emulator/simulator requires Android Studio (Android) or Xcode (iOS,
   macOS-only) installed separately — Expo Go on a physical phone avoids that entirely.

## Database Schema

27 tables across 23 migrations. Every table has RLS enabled with select/insert/update/delete
policies scoped to `auth.uid() = user_id` (see `RULES.md` §1) — audit-only tables like
`payment_events`/`monthly_email_logs` omit update/delete since they're never user-editable.

- `accounts`, `categories`, `budget_limits` — core config
- `transactions`, `recurring_transactions`, `cashbook` — cash flow
- `investment_log`, `holdings` — portfolio (`total_cashflow` on `investment_log` is a generated column; `holdings.live_price` is the manual/refreshed price override per symbol)
- `goals`, `insurance_policies`, `net_worth_snapshots`
- 13 asset tables — `assets_fixed_deposits`, `assets_recurring_deposits`, `assets_ppf`, `assets_nps`, `assets_ssy`, `assets_sgb`, `assets_nsc`, `assets_gold`, `assets_ulip`, `assets_real_estate`, `assets_vehicles`, `assets_epf`, `assets_loans_liabilities`
- `user_profiles` — onboarding + subscription tier fields
- `payment_events`, `monthly_email_logs` — payment idempotency and email-cron audit logs

`supabase/migrations/` is the only source of schema truth — apply changes via a new
migration file, never a manual dashboard edit. See `RULES.md` §1 for the migration-drift
check to run before every `db push`.

## Environment Variables

### Required for Web App (`apps/web/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Optional for Development (`.env`)

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_PASSWORD=your-database-password
```

## Available Scripts

Run from the repo root (Turborepo fans these out to every app/package):

- `pnpm dev` - Start development server (web + mobile, wherever a `dev`/`start` script exists)
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run unit tests (packages/shared)

Scope any script to a single app with `--filter`, e.g. `pnpm --filter web dev` or
`pnpm --filter mobile start` — see [Running the Apps](#running-the-apps) above.

## Authentication

The application supports two authentication methods:

1. **Email/Password**: Traditional signup and login
2. **Google OAuth**: Sign in with Google account

Protected routes automatically redirect to `/auth/login` if user is not authenticated.

## Key Features in Detail

### Transactions
- Add income and expense records
- Categorize transactions
- View transaction history with pagination
- Edit and delete transactions

### Investment Log
- Log BUY/SELL/DIVIDEND transactions
- Track quantity, price, and fees
- View portfolio holdings summary
- Calculate P&L per holding

### Goals
- Set financial goals with target amounts
- Track progress with visual progress bars
- Set target dates and priorities
- View goal status (on track, behind, achieved)

### Cashbook
- Track informal lending/borrowing
- Record due dates and amounts
- Link to loans from Assets
- View receivables and payables summary

### Assets
13 classes: Fixed Deposits, Recurring Deposits, PPF, NPS, SSY, SGB, NSC, Gold, ULIP, Real
Estate, Vehicles, EPF, and Loans/Liabilities — each with its own maturity/valuation tracking.

### Portfolio
- Group investments by symbol, weighted-average cost basis
- Live price refresh (AMFI for mutual funds, Yahoo Finance for stocks/ETFs)
- Stock fundamentals (P/E, 52-week range, margins, market cap, beta, dividend yield)
- Portfolio-vs-Nifty-50 benchmark chart, passive income projection, tax-loss harvesting
- Show current value and P&L, display recent transactions

### Dashboard
- Monthly income/expense summary
- Net savings and savings rate
- Portfolio P&L overview
- Goals progress
- Recent activity

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow existing component patterns
- Use TailwindCSS for styling
- Implement proper error handling
- Add loading states for async operations

### Adding New Features
1. Add database migration in `supabase/migrations/`
2. Create Zod schema in `packages/shared/src/schemas/`
3. Add query functions in `packages/shared/src/queries/`
4. Create React hook in `apps/web/src/hooks/`
5. Build UI components in `apps/web/src/components/`
6. Create page in `apps/web/src/app/`

### Monorepo Usage
- Shared code goes in `packages/shared/`
- Import shared code using `@repo/shared`
- Web app imports use `@/` alias for `apps/web/src/`

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
pnpm build
# Output in apps/web/.next
```

Deploy the `.next` folder to your hosting provider.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

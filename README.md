# Finance Tracker SaaS

A comprehensive personal finance and investment tracking application built with Next.js, Supabase, and TypeScript.

## Features

- **Transaction Management**: Track income and expenses with categories
- **Investment Portfolio**: Log and monitor stock/mutual fund investments
- **Goal Tracking**: Set and track financial goals with progress visualization
- **Cashbook**: Manage personal loans and informal lending/borrowing
- **Asset Management**: Track fixed deposits, gold holdings, and loans
- **Portfolio Dashboard**: View investment holdings with P&L calculations
- **Analytics Dashboard**: KPIs for income, expenses, savings rate, and portfolio performance
- **Authentication**: Email/password and Google OAuth authentication

## Tech Stack

- **Web**: Next.js 16 (App Router), React, TypeScript
- **Mobile**: Expo (React Native) + Expo Router — scaffolded, screens land in Phase 4
- **UI**: TailwindCSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth via `@supabase/ssr`, RLS)
- **State Management**: TanStack Query
- **Forms**: React Hook Form with Zod validation
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
│       │   ├── logic/       # Business logic calculations, matches DATA_MODEL.md
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

## Database Schema

The application uses the following main tables (every table has RLS enabled with
select/insert/update/delete policies scoped to `auth.uid() = user_id`):

- `accounts` - Bank/cash/trading accounts register
- `categories` - Income/Expense/Transfer categories
- `budget_limits` - Monthly ₹ limit per expense category
- `transactions` - Income and expense records
- `investment_log` - Stock/mutual fund transactions (`total_cashflow` is a generated column)
- `holdings` - Manual live-price override per symbol (Portfolio view lands in Phase 3)
- `goals` - Financial goals with targets
- `cashbook` - Personal lending/borrowing records
- `assets_fixed_deposits` - Fixed deposit holdings
- `assets_gold` - Gold holdings
- `assets_loans_liabilities` - Loan/liability records

`supabase/migrations/` is the only source of schema truth — apply changes via a new
migration file, never a manual dashboard edit.

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

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run unit tests (packages/shared)

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
- **Fixed Deposits**: Bank FDs with maturity tracking
- **Gold**: Gold holdings with purity and weight
- **Loans**: Personal loans with EMI tracking

### Portfolio
- Group investments by symbol
- Calculate average cost basis
- Show current value and P&L
- Display recent transactions

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

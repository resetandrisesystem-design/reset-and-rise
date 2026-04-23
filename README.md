# Reset & Rise™ — Web App

> *"While it looked like I was breaking… I was brewing."*

A full-stack life planner SaaS for busy women. Built with Next.js 14, Supabase, and the Claude AI API.

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14 (App Router) + TypeScript |
| Styling     | Tailwind CSS (custom brand palette)  |
| Backend/DB  | Supabase (Postgres + Auth + RLS)     |
| AI Journal  | Anthropic Claude API                 |
| Deployment  | Vercel (recommended)                 |

---

## Features

- **User auth** — Email/password signup, login, email confirmation (Supabase Auth)
- **Daily Planner** — Top 3 priorities, time blocks (morning/afternoon/evening), habit tracker
- **Mind Reset Zone** — Mood selector, stress slider, brain dump, reflection prompts, peace bank, 7-day mood history
- **Money Reset** — Income tracker, expense categories with visual bars, savings goal progress, monthly history
- **Meal Planner** — 7-day meal grid, grocery list, batch cooking planner, AI meal suggestions
- **AI Journal** — Guided prompts, Claude AI personalised responses, gratitude section, past entries
- **Auto-save** — All entries save automatically with debounce (no save button needed)
- **Row Level Security** — All data is private to each user

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/yourusername/reset-and-rise.git
cd reset-and-rise
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project, go to **SQL Editor → New Query**
3. Copy and paste the entire contents of `supabase-schema.sql` and click **Run**
4. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon public` key

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-anthropic-key     # For AI Journal feature
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configure Supabase Auth

In Supabase → **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000` (or your Vercel URL for production)
- Redirect URLs: `http://localhost:3000/auth/callback`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

---

## Deployment to Vercel

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial Reset & Rise commit"
git branch -M main
git remote add origin https://github.com/yourusername/reset-and-rise.git
git push -u origin main
```

### Step 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Add environment variables (same as `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_APP_URL` → your Vercel URL (e.g. `https://reset-and-rise.vercel.app`)
4. Click **Deploy**

### Step 3 — Update Supabase redirect URLs

In Supabase → Authentication → URL Configuration, add your production URL:
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

---

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx          # Login page
│   │   ├── signup/page.tsx         # Signup page
│   │   └── callback/route.ts       # Email confirmation handler
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard shell (sidebar)
│   │   ├── page.tsx                # Overview / home
│   │   ├── planner/page.tsx        # Daily planner
│   │   ├── mental/page.tsx         # Mind reset
│   │   ├── finance/page.tsx        # Money reset
│   │   ├── meals/page.tsx          # Meal planner
│   │   └── journal/page.tsx        # AI journal
│   └── api/
│       └── ai-journal/route.ts     # Claude AI endpoint
├── components/
│   ├── ui/Sidebar.tsx              # Navigation sidebar
│   ├── planner/DailyPlannerClient.tsx
│   ├── mental/MentalHealthClient.tsx
│   ├── finance/FinanceClient.tsx
│   ├── meals/MealsClient.tsx
│   └── journal/JournalClient.tsx
├── lib/
│   └── supabase/
│       ├── client.ts               # Browser Supabase client
│       └── server.ts               # Server Supabase client
├── types/index.ts                  # TypeScript types
└── middleware.ts                   # Auth route protection
```

---

## Getting your Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account or log in
3. Go to **API Keys → Create Key**
4. Add it to your `.env.local` as `ANTHROPIC_API_KEY`

The AI Journal will still work without a key — it will show a default warm message instead.

---

## Customisation

### Brand colours (tailwind.config.js)
- `navy` — `#1a2744` (primary brand colour)
- `gold` — `#d4af54` (accent, highlights)
- `ivory` — `#f9f6ee` (background, surfaces)
- `blush` — accent pink

### Adding new habits
Users can add custom habits in Supabase directly, or you can build a habit management UI using the `habits` table.

### Pricing / Monetisation
This app is ready to add Stripe for paid plans:
1. Add a `subscription_tier` column to `profiles`
2. Gate AI Journal behind a paid tier
3. Use Stripe Checkout + webhooks to update the tier

---

## Roadmap ideas

- [ ] Weekly planner view with drag-and-drop
- [ ] Push notifications / reminders
- [ ] Parenting Lane section
- [ ] Faith-based add-on module
- [ ] PDF export of weekly planner
- [ ] Affiliate income tracker
- [ ] Mobile app (React Native / Expo)
- [ ] Stripe payments for premium tier

---

## Made with love by Joyce — Reset & Rise™

*"Brew calm. Brew clarity. Brew control."*

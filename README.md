# CampusOne

**Campus Reservation & Pickup Platform**

CampusOne allows students to browse campus items, reserve them instantly, and notify staff via WhatsApp — skipping queues entirely.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript 6, Vite 8 |
| Styling | Tailwind CSS v4 + Custom CSS |
| Routing | React Router v7 |
| Backend | Supabase (Auth + PostgreSQL + RLS) |

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- A [Supabase](https://supabase.com) project

### Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd my-repo

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your Supabase URL and anon key

# 4. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**

### Build for Production

```bash
npm run build
npm run preview
```

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ **Never commit your `.env` file.** Only `.env.example` (with empty values) is tracked by git.

## Project Structure

```
src/
├── components/
│   └── common/          # Button, Logo, PlaceholderPage
├── constants/           # Routes, staff types, statuses
├── contexts/            # Auth context (Phase 2)
├── hooks/               # Custom hooks (Phase 2+)
├── layouts/             # MainLayout, StudentLayout, StaffLayout
├── lib/
│   └── supabase.ts      # Supabase client
├── pages/
│   ├── Landing.tsx      # Landing page ✅
│   ├── auth/            # Register, Login pages (Phase 2)
│   ├── student/         # Dashboard, Items, Cart, Reservations (Phase 2-5)
│   ├── staff/           # Staff dashboards (Phase 7)
│   └── errors/          # 404
├── routes/
│   └── index.tsx        # All route definitions
├── services/            # Supabase service layer (Phase 2+)
├── types/
│   ├── index.ts         # Shared app types
│   └── database.ts      # Supabase DB types
└── utils/               # Utility functions (Phase 2+)
```

## Routes

| Path | Page | Status |
|------|------|--------|
| `/` | Landing | ✅ Phase 1 |
| `/register` | Account Selection | 🚧 Phase 2 |
| `/register/student` | Student Register | 🚧 Phase 2 |
| `/register/staff` | Staff Register | 🚧 Phase 2 |
| `/login` | Student Login | 🚧 Phase 2 |
| `/login/staff` | Staff Login | 🚧 Phase 2 |
| `/profile/setup` | Profile Setup | 🚧 Phase 3 |
| `/dashboard` | Student Dashboard | 🚧 Phase 2 |
| `/items` | Browse Items | 🚧 Phase 4 |
| `/items/:id` | Item Detail | 🚧 Phase 4 |
| `/cart` | Cart | 🚧 Phase 5 |
| `/checkout` | Checkout | 🚧 Phase 5 |
| `/reservations` | My Reservations | 🚧 Phase 5 |
| `/reservations/:id` | Reservation Detail | 🚧 Phase 5 |
| `/staff/canteen` | Canteen Dashboard | 🚧 Phase 7 |
| `/staff/bookstore` | Bookstore Dashboard | 🚧 Phase 7 |

## Development Phases

- **Phase 1** ✅ — Foundation (React, Vite, Tailwind, Router, Supabase client, Landing page)
- **Phase 2** 🔜 — Authentication (register, login, route guards)
- **Phase 3** — Mandatory student profile
- **Phase 4** — Products (browsing, details)
- **Phase 5** — Cart, checkout, reservations
- **Phase 6** — WhatsApp notification integration
- **Phase 7** — Staff dashboards
- **Phase 8** — UI polish, loading states, error handling

## Security

- Only the Supabase **anon/public key** is used in the browser
- The service-role key is **never** exposed to frontend code
- Row Level Security (RLS) will be configured on all tables in Phase 2
- Students cannot access staff routes (route guards in Phase 2)

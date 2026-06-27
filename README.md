# TaskFlow — Team Task & Project Manager ⚡

A high-performance full-stack task and project management web application built for modern engineering teams.

## 🛠️ Tools and Technologies

- **Language:** TypeScript
- **Frontend Framework:** React.js (Next.js App Router)
- **Backend Framework:** Node.js (Next.js Route Handlers)
- **Styling:** TailwindCSS
- **Database:** [Neon Serverless PostgreSQL](https://neon.tech)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team)
- **Deployment:** [Vercel](https://vercel.com)
- **Package manager:** [pnpm](https://pnpm.io)

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js (v18.17+ or v20+)
- [pnpm](https://pnpm.io)
- A free [Neon](https://neon.tech) PostgreSQL database instance

### 2. Setup Environment Variables

Copy the example configuration to `.env.local` (env files are vault-restored via `automata\tools\env-sync.ps1`):

```bash
cp .env.example .env.local
```

Update `DATABASE_URL` in `.env.local` with your Neon connection string:

```env
DATABASE_URL=postgresql://neondb_owner:<password>@<neon-host>.neon.tech/neondb?sslmode=require
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Push Database Schema to Neon

Using Drizzle Kit:

```bash
pnpm db:push
```

*(Optional) Seed the database with sample projects, tasks, and users:*

```bash
pnpm db:seed
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 📂 Project Structure

```
taskflow/
├── src/
│   ├── app/                    # Next.js App Router (React components & API Routes)
│   │   ├── (dashboard)/        # Authenticated workspace pages (Dashboard, Tasks, Projects, Admin)
│   │   ├── api/                # Node.js backend route handlers (Auth, Tasks, Projects, Admin)
│   │   ├── join/               # Project invitation acceptance flow
│   │   ├── reset/              # Password recovery flow
│   │   ├── globals.css         # TailwindCSS styles and design tokens
│   │   ├── layout.tsx          # Root HTML layout with context providers
│   │   └── page.tsx            # Auth landing & sign-in / registration screen
│   ├── components/             # Reusable UI components
│   │   ├── layout/             # Sidebar, Topbar, AppShell
│   │   ├── modals/             # TaskModal, ProjectModal, InviteModal, AddUserModal
│   │   └── ui/                 # Avatar, Badge, StatCard, Toast
│   ├── context/                # Global React context (AuthContext, Theme)
│   ├── db/                     # Database layer
│   │   ├── schema.ts           # Drizzle PostgreSQL schema definitions
│   │   ├── index.ts            # Neon serverless database client
│   │   └── seed.ts             # Database seeder script
│   └── lib/                    # Shared utility libraries
│       ├── api.ts              # Strongly-typed client API SDK
│       ├── auth.ts             # JWT auth & password encryption
│       ├── email.ts            # Nodemailer email dispatcher
│       └── utils.ts            # Date calculations, Tailwind merge, spam filter
├── drizzle.config.ts           # Drizzle Kit configuration
├── package.json
└── tsconfig.json
```

---

## 🚢 Deploying to Vercel

1. Push your repository to GitHub or GitLab.
2. Import the repository in [Vercel](https://vercel.com).
3. Under **Environment Variables**, add:
   - `DATABASE_URL` (Your Neon connection string)
   - `JWT_SECRET` (A strong random secret string)
   - `NEXT_PUBLIC_APP_URL` (Your production domain or `https://your-app.vercel.app`)
4. Click **Deploy**. Vercel will automatically build the Next.js TypeScript application.

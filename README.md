# HabitsForge
> Build habits that actually stick.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

---

## What is HabitsForge?
Most people fail to build habits because they lack clear direction and actionable feedback on their progress. HabitsForge solves this by combining AI-powered coaching to break down big goals, visual streak tracking to gamify consistency, and smart reminders to keep you accountable. It is built for anyone striving to create consistent daily routines without the overwhelming clutter of typical productivity apps.

---

## Live Demo
- **Link:** [https://habitsforge.vercel.app](https://habitsforge.vercel.app)
- *Sign in with Google to get started instantly.*

---

## Features
🤖 **AI Habit Coach** — Describe a goal, get 3 Gemini-powered habit suggestions  
🔥 **Streak Tracking** — Current and best streaks with 7-day visual grid  
📊 **30-Day Heatmap** — See your consistency at a glance  
📈 **Smart Analytics** — Best day of week chart and overall stats card  
🧊 **Streak Freeze** — Protect your streak once per week  
🏅 **Milestone Badges** — Week Warrior (7), Monthly Master (30), Century Club (100)  
📝 **Habit Notes** — Add a note when checking in each day  
🗄️ **Archive Habits** — Soft-delete with full history preserved  
🔔 **Browser Reminders** — Custom reminder time per habit  
🎉 **Confetti Celebration** — Fires when all habits are done for the day  
↕️ **Drag to Reorder** — Organise habits in your preferred order  
🔐 **Authentication** — Email signup + Google OAuth via Supabase  

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Language | TypeScript | Type safety across the entire codebase |
| Framework | React 18 + Vite | Component-based UI with fast dev server |
| Styling | Tailwind CSS + Neobrutalism | Custom design system with bold aesthetics |
| Backend | Supabase (PostgreSQL) | Database with Row Level Security |
| Auth | Supabase Auth | Email + Google OAuth |
| AI | Google Gemini API | Habit suggestions + weekly insights |
| Deployment | Vercel | Auto-deploy from GitHub |

---

## Project Structure
```text
src/
├── components/
│   ├── habits/       # HabitCard, HabitForm, HeatMap, StatsCard etc
│   ├── layout/       # Navbar, AuthGuard, TabBar
│   └── ui/           # Spinner, Toast, HabitIcon
├── hooks/            # useHabits, useNotifications, useWindowSize
├── lib/              # supabase.ts, gemini.ts, streakUtils.ts
├── pages/            # All page components
├── styles/           # globals.css with design system variables
└── types/            # TypeScript interfaces
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- A Supabase account (free tier works)
- A Google Gemini API key (free at aistudio.google.com)

### Installation
1. Clone the repo
   ```bash
   git clone https://github.com/your-username/habitsforge.git
   cd habitsforge
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Create `.env` file
   ```bash
   touch .env
   ```
4. Run SQL migrations
   *(See Database Setup section below and run the queries in your Supabase SQL Editor)*
5. Start development server
   ```bash
   npm run dev
   ```

---

## Environment Variables

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable key | Supabase Dashboard → Settings → API Keys |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |

---

## Database Setup
Run the following SQL in your Supabase SQL Editor to set up the database and Row Level Security:

```sql
-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Habits Table
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_time TEXT,
  freeze_used_week TEXT,
  streak_frozen BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own habits" ON habits FOR ALL USING (auth.uid() = user_id);

-- 3. Habit Logs Table
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  log_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, log_date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own logs" ON habit_logs FOR ALL USING (auth.uid() = user_id);
```

---

## Key Technical Decisions

**Why React + TypeScript + Supabase**  
Building with React allowed for seamless component reuse (like habit cards and stat modules). Enforcing strict TypeScript helped catch state shape bugs at compile time, saving hours of debugging. Supabase was chosen because it provided authentication, a PostgreSQL database, and Row Level Security completely out of the box, removing the need to write and deploy a custom backend within a tight one-week build window.

**Streak algorithm design**  
Streaks are calculated client-side from raw log dates using local time rather than UTC. This is crucial because it ensures that habits completed at 11:30 PM locally actually count for "today" regardless of the server's time zone. To avoid N+1 queries when loading the dashboard, all logs for a user are fetched via a single batched Supabase query and grouped by `habit_id` in memory.

**Gemini AI integration**  
The Gemini AI habit coach uses a strict system prompt that forces JSON-only output. This ensures the raw response can be safely parsed into the UI without wrestling with complex regex patterns. As a fallback, the code automatically strips markdown backtick fences if the model occasionally returns them. Furthermore, insight results are cached in `localStorage` for 7 days to deliver instant loading and avoid unnecessary API calls.

**Neobrutalism design choice**  
I deliberately chose a bold, high-contrast neobrutalist design system to make HabitsForge memorable and visually distinctive from typical, minimalist habit trackers. The hard shadows, thick borders, and highly saturated colors command attention. Visual consistency is strictly enforced via CSS variables and global rules applied universally across all interactive components.

---

## What I'd Improve With More Time
- Background push notifications via service workers (reminders currently require the tab to be open)
- Send 30 days of data to Gemini instead of 7 for deeper personalised coaching insights
- Social streak sharing — generate a shareable streak card image
- Offline support — cache habits in IndexedDB, sync when back online

---

## Evaluation Criteria Met

| Criteria | How HabitsForge addresses it |
|----------|------------------------------|
| **Functionality** | Full CRUD, real auth, live AI, working streaks |
| **Code Quality** | TypeScript strict mode, JSDoc, no console.logs, single batched queries |
| **Problem-Solving** | N+1 prevention, local time streaks, Gemini JSON enforcement, RLS |
| **Communication** | Documented WHY comments, architecture overview, this README |

---

## License
MIT License

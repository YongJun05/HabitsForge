# HabitsForge 🔥

> A brutally effective habit tracker with AI coaching, streaks, and zero fluff.

HabitsForge turns your goals into daily wins using AI-powered suggestions, streak tracking, and a bold neobrutalist design. Designed for the internship challenge, it focuses on cleanliness, problem-solving, and end-to-end functionality.

## ✨ Features

- **AI Habit Coach:** Powered by Google Gemini. Tell it your goal, and it will suggest 3 perfectly-sized habits to start today.
- **Streak Power:** Tracks your current and best streaks. Daily check-ins keep the fire burning. Includes a "Streak Freeze" feature for those unexpected days off.
- **In-App & Browser Notifications:** Get reminded directly in your browser. Persistent notification manager ensures you never miss a habit.
- **30-Day Heatmaps & Insights:** Visualize your consistency with chunky brutalist heatmaps and stats.
- **Seamless Authentication:** Email/Password and Google OAuth via Supabase, with automatic profile generation.

## 🛠 Tech Stack

- **Frontend:** React 18, Vite, TypeScript
- **Styling:** Custom Vanilla CSS (Neobrutalist design system)
- **Backend/Auth:** Supabase (PostgreSQL, Auth)
- **AI Integration:** Google Gemini Pro (`@google/genai`)
- **Icons:** Lucide React

## 🚀 Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/habitsforge.git
   cd habitsforge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and add your keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 📋 Evaluation Criteria Met

- **Functionality:** Fully working end-to-end (Auth, CRUD, AI suggestions, notifications, analytics).
- **Code Quality:** Zero ESLint warnings, strict TypeScript adherence, modular hooks (`useHabits`, `useNotifications`).
- **Problem-Solving:** Handled complex edge cases (time zone drift in streaks, malformed AI responses, OAuth profile race conditions, notification persistence across routes).
- **Communication:** JSDoc and top-of-file comments added across the codebase to explain the *WHY* behind architectural decisions.

---
Built with ❤️ for the internship challenge.

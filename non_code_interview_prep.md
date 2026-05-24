# HabitsForge — Non-Code Interview Questions

> **Context:** A Shortcut Asia senior engineer is sitting in front of your live app at habitsforge.vercel.app, clicking through it, and asking you questions about what they see. These are NOT code questions — they're about your thinking.
>
> **Presentation: 25 May 2026 (tomorrow)**

---

## CATEGORY 1 — Technical Decisions

> *They're clicking through features and asking "why did you build it this way?"*

---

### Q1: "I see you're using Google sign-in and also email/password. Why both? Why not just one?"

**What they're really testing:** Do you understand authentication UX and user conversion?

**Ideal answer:**
> "Google OAuth removes friction — most people already have a Google account, so it's one click to start. But some users don't want to connect their Google account to every app, or they might be in an environment where Google is restricted. Email/password gives them an alternative. Having both maximises the number of people who will actually sign up instead of bouncing on the login page. I used Supabase Auth for both, so supporting two methods didn't add much engineering complexity."

---

### Q2: "When I mark a habit as done, I notice a small note panel pops up. Why didn't you just mark it done immediately?"

**What they're really testing:** Product thinking — did you think about user workflows?

**Ideal answer:**
> "I wanted to add a journaling element without making it feel heavy. When you check off a habit, the note panel gives you the option to reflect — 'How did the run go?' or 'Read 20 pages today.' But I made it optional — you can skip with one click. This was a deliberate design choice: the note feature adds depth for engaged users without slowing down users who just want to quickly check things off. The notes also show up in the Recent Log on the details tab, so there's a payoff for writing them."

---

### Q3: "I see your AI habit coach suggests 3 habits with icons, times, and colours already picked. Why exactly 3? Why not 5 or 1?"

**What they're really testing:** Did you think about this, or just pick a random number?

**Ideal answer:**
> "Three is a deliberate choice based on the paradox of choice. Too many options cause decision paralysis — if I showed 10 suggestions, users would spend more time choosing than acting. One suggestion feels too restrictive. Three gives enough variety to find something that resonates while keeping the decision fast. I also constrained the AI to return exactly 3 using a response schema, so the UI layout is always predictable — three cards in a row, never more, never less."

---

### Q4: "Your app uses a very bold, high-contrast design — thick borders, hard shadows, bright yellow. What's the thinking behind that?"

**What they're really testing:** Design intentionality — did you just pick a template?

**Ideal answer:**
> "It's called neobrutalism. I chose it deliberately because every habit tracker on the market looks the same — soft rounded corners, pastel colours, minimal. I wanted HabitsForge to feel different and energetic. Habits require boldness — you're committing to a daily action. The thick borders and hard shadows feel decisive, not passive. It also makes the app instantly recognisable. I built it as a design system with reusable CSS classes — every button, card, and input follows the same visual language, so it feels consistent across the whole app."

---

### Q5: "I notice when I drag and drop habits to reorder them, the new order persists when I refresh. How does that work without a backend reordering endpoint?"

**What they're really testing:** Do you understand data persistence?

**Ideal answer:**
> "Each habit has a `sort_order` field in the database. When you drop a habit into a new position, I update the sort_order for all affected habits. The dashboard fetches habits ordered by sort_order first, then by created_at as a tiebreaker. So the order is persisted in the database — it's not just a frontend rearrangement. It survives refreshes, logouts, and even switching devices."

---

## CATEGORY 2 — Architecture

> *They want to understand how the pieces fit together without seeing code.*

---

### Q6: "Walk me through what happens from the moment I click 'Mark Done' to seeing the green checkmark. What systems are involved?"

**What they're really testing:** Can you explain data flow end-to-end?

**Ideal answer:**
> "When you click 'Mark Done,' the note panel appears. Once you save or skip, the app checks if you've already logged today — if yes, it deletes that log (undo). If not, it inserts a new row into the `habit_logs` table in Supabase with today's date, your user ID, and the optional note. Supabase's Row Level Security verifies your identity at the database level. After the insert succeeds, the app re-fetches all your habits and logs, recalculates your streak, and re-renders the card with the green checkmark. If all habits are now done for the day, confetti fires."

---

### Q7: "How does your app know to send me a reminder at exactly the time I set?"

**What they're really testing:** Do you understand your own notification architecture?

**Ideal answer:**
> "There's a background component called NotificationManager that runs for the entire app session — it's mounted at the top level so it never unmounts when you navigate between pages. Every 15 seconds, it checks the current time and compares it against each habit's reminder time. If they match and you haven't already completed that habit today, it fires a browser notification and adds it to the in-app notification bell. The 15-second interval means it might fire up to 15 seconds late, but it'll never miss a reminder while the tab is open."

---

### Q8: "I see there's a bell icon in the navbar with an unread count. If I mark a habit as done in another tab, does the bell still fire a reminder for it?"

**What they're really testing:** Have you thought about edge cases and multi-tab behaviour?

**Ideal answer:**
> "Good question. The NotificationManager re-fetches habit data from Supabase every 60 seconds, including which habits are already done today. So if you mark a habit done in another tab, within 60 seconds the other tab will pick up that it's done and skip the reminder. It's not instant, but it prevents most duplicate notifications. If I had more time, I'd use Supabase's realtime subscriptions to get instant sync between tabs."

---

### Q9: "You have a landing page, dashboard, settings, login, signup — how did you decide what gets its own page versus what's a tab within the dashboard?"

**What they're really testing:** Information architecture thinking.

**Ideal answer:**
> "The dashboard uses tabs because the three views — your habits list, the add/edit form, and the detail view — are all part of the same workflow. You check off habits, add new ones, and view stats in one session. Putting them in tabs keeps the flow fast without full page reloads. Settings is a separate page because it's a different mental context — you don't go to settings during your daily check-in. Landing, login, and signup are separate because they're public pages that unauthenticated users see. The dashboard is protected by an AuthGuard that redirects you if you're not logged in."

---

### Q10: "How does your app make sure that User A can never see User B's habits?"

**What they're really testing:** Do you understand security architecture?

**Ideal answer:**
> "Two layers. First, every database query filters by the logged-in user's ID, so the app only requests that user's data. But more importantly, I have Row Level Security enabled on every table in Supabase. The policy on the habits table says 'users can only access rows where user_id equals their authenticated ID.' This means even if someone manipulates the frontend or sends a crafted API request, the database itself rejects the query. Security is enforced at the data layer, not the application layer — so a frontend bug can't leak data."

---

## CATEGORY 3 — Trade-offs

> *They'll point at specific features and ask "what did you sacrifice to build this?"*

---

### Q11: "I notice reminders only work when I have the app open in a tab. Why didn't you implement push notifications that work when the app is closed?"

**What they're really testing:** Can you honestly discuss limitations and prioritisation?

**Ideal answer:**
> "Push notifications require a service worker, a push server with VAPID keys, managing push subscriptions per device, and a server-side scheduler to fire them at the right time. That's easily 3-4 days of work for one feature. I had one week to build the entire app. So I chose in-tab polling because I could deliver a working notification system in a single component in one day. It covers the most common use case — someone who has the app open during their routine. With more time, I'd use a Supabase Edge Function on a cron schedule to send push notifications."

---

### Q12: "Your streak freezes — I can only use one per week. Why one? Why not unlimited, or one per day?"

**What they're really testing:** Game design thinking and preventing feature abuse.

**Ideal answer:**
> "Unlimited freezes would make streaks meaningless — you could miss every other day and still show a perfect streak. One per day would be too generous — it effectively halves the requirement. One per week is the sweet spot: it acknowledges that life happens — you get sick, you travel, you have a bad day — but it doesn't let you game the system. I track which ISO week the freeze was used, so you can't use it twice in the same week. The specific threshold was inspired by Duolingo's streak freeze, which uses a similar model."

---

### Q13: "When I click the AI coach, there's a noticeable delay before suggestions appear. Did you consider caching or making it faster?"

**What they're really testing:** Performance awareness.

**Ideal answer:**
> "Yes, the delay is the Gemini API call — it typically takes 2-3 seconds. I show a loading spinner with 'ANALYSING YOUR GOAL...' so the user knows something is happening. I considered caching results for common goals, but the value of the AI is personalised suggestions — caching 'get healthier' would return the same habits to everyone, which defeats the purpose. The real improvement would be streaming the response so suggestions appear one at a time as they're generated, instead of waiting for all three. That would make it feel faster even if the total time is the same."

---

### Q14: "I see you archive habits instead of deleting them. Isn't that just taking up database space for no reason?"

**What they're really testing:** Data architecture philosophy.

**Ideal answer:**
> "Archiving preserves history — if someone deletes a habit they've tracked for 60 days, those 60 logs become orphaned and meaningless. With archive, the habit is hidden from the dashboard but the data stays intact. Users can restore it from Settings if they change their mind. This is standard practice in production apps — it's called soft delete. The database cost is negligible, and it prevents the support nightmare of 'I accidentally deleted my habit, can you bring it back?' I do offer permanent delete in Settings for users who genuinely want their data gone."

---

### Q15: "Your app loads all habits and all logs every time. What happens when a user has been using this for a year with 20 habits?"

**What they're really testing:** Scalability thinking.

**Ideal answer:**
> "Good question. After a year with 20 habits, that's roughly 7,000 log rows. Fetching all of them on every dashboard load would start to feel slow. The fix would be pagination — only fetch logs from the last 30 or 60 days for the dashboard view, and fetch full history only when the user opens the detail tab for a specific habit. I could also add an index on `log_date` in the database to make date-range queries faster. For the streak calculation, I'd only need the most recent consecutive dates, not the full history."

---

## CATEGORY 4 — Problem-Solving Approach

> *They want to see how you think when facing challenges.*

---

### Q16: "What was the single hardest technical problem you had to solve in this project, and how did you approach it?"

**What they're really testing:** Problem-solving process, not just the solution.

**Ideal answer:**
> "The streak calculation. It sounds simple — count consecutive days — but the edge cases are tricky. What if the user hasn't logged today yet? The streak shouldn't be zero just because it's 8am. What about timezones? If I'm in Singapore and log at 11pm, the server in UTC thinks it's the next day. And how does the freeze interact with a streak gap? I solved it by working in local date strings everywhere — `YYYY-MM-DD` based on the user's browser time, not UTC. And for the 'today vs yesterday' problem, I start counting from today if there's a log, otherwise from yesterday. I wrote it as a pure function with no side effects so I could test each edge case independently."

---

### Q17: "How did you decide on the order of features to build? What came first and why?"

**What they're really testing:** Prioritisation and project management.

**Ideal answer:**
> "Authentication first, because nothing else works without it. Then the data model — habits and logs in Supabase with RLS. Then the core loop: create a habit, mark it done, see your streak. That's the minimum viable product. Once that worked end-to-end, I layered on features in order of user impact: the AI coach (differentiator), notifications (retention), heatmap and stats (engagement), streak freeze (forgiveness), archive (data safety), drag-to-reorder (quality of life). I saved visual polish — confetti, milestone badges — for the end, because they're rewarding but not structural."

---

### Q18: "You used AI tools during development. How did you use them, and how do you make sure you actually understand what they generated?"

**What they're really testing:** Honesty and self-awareness about AI-assisted development.

**Ideal answer:**
> "I used AI as a pair programmer, not a ghostwriter. For example, I had the AI help me with the ISO week number calculation — I knew I needed it for streak freeze tracking, but the algorithm involves edge cases with year boundaries that I didn't want to get wrong. But I made sure I understood every line: the ISO week is based on the nearest Thursday, weeks start on Monday, and the year the week belongs to might differ from the calendar year. I can explain any piece of my code because I didn't copy-paste blindly — I used AI to move faster, but I verified and understood everything. The WHY comments throughout my codebase are mine, not generated."

---

### Q19: "If a user reports that their streak reset to zero even though they completed their habit yesterday, how would you debug that?"

**What they're really testing:** Debugging methodology.

**Ideal answer:**
> "First, I'd check the timezone. My streak calculation uses local time, but the database stores dates. If the user logged at 11:50 PM and their browser timezone doesn't match what I expected, the stored date might be off by a day. Second, I'd check the `habit_logs` table directly in Supabase to see if yesterday's log actually exists — maybe the insert failed silently. Third, I'd check if they used a streak freeze that week — the freeze might have already been consumed by an earlier gap. My approach would be: reproduce the exact conditions, then trace the data from the database through the streak function step by step."

---

### Q20: "I see you built your own notification system instead of using a library. Why?"

**What they're really testing:** Build vs. buy decision-making.

**Ideal answer:**
> "My notification needs were simple: check time, compare to habit reminders, fire a browser notification, and show it in a bell dropdown. A library would add bundle size and API surface area for a problem that's basically a setInterval with a time comparison. I also needed the notifications scoped to user IDs in localStorage, which is specific to my app — no library does that out of the box. If I needed rich features like notification grouping, snoozing, or priority queues, then a library would make sense. But for what I needed, 80 lines of custom code was cleaner than a dependency."

---

## CATEGORY 5 — Product Thinking

> *They want to see that you think about users, not just technology.*

---

### Q21: "Who is this app for? And more importantly, who is it NOT for?"

**What they're really testing:** Target audience clarity.

**Ideal answer:**
> "It's for people who want to build simple daily habits and need visual motivation to stay consistent — students, young professionals, anyone starting a new routine. The streak gamification and AI coaching lower the barrier to getting started. Who it's NOT for: project managers who need task management, fitness enthusiasts who need workout tracking with sets and reps, or teams who need shared accountability. I deliberately kept the scope narrow — daily habits only, no to-do lists, no calendars. One job, done well."

---

### Q22: "I notice confetti fires when all habits are done for the day. Is that just a fun thing, or is there thinking behind it?"

**What they're really testing:** Understanding of behavioural psychology in product design.

**Ideal answer:**
> "It's deliberate. It's based on the concept of variable reward and completion feedback. Confetti fires only when ALL habits are done — not when you check off one. This creates an incentive to complete everything, not just your easy habits. It's the same psychology behind closing all your Activity rings on an Apple Watch. The celebration is brief — about one second — so it doesn't get annoying over time. But that moment of visual celebration creates a dopamine hit that reinforces the behaviour of completing your full routine."

---

### Q23: "If you had to add ONE feature tomorrow to increase user retention, what would it be?"

**What they're really testing:** Prioritisation and retention thinking.

**Ideal answer:**
> "Push notifications that work when the app is closed. Right now, the app can only remind you if the tab is open. The biggest retention killer for habit apps is forgetting to open them. A morning push notification saying 'You have 3 habits to complete today' would bring users back daily without them needing to remember. Everything else — social features, sharing, leaderboards — is secondary to just getting the user to open the app. Push notifications solve the hardest problem in habit apps: the empty chair."

---

### Q24: "Your milestone badges are at 7 days, 30 days, and 100 days. How did you pick those numbers?"

**What they're really testing:** Did you research this or guess?

**Ideal answer:**
> "They're based on habit formation research. 7 days is the initial momentum milestone — you've survived a full week, which is when most people drop off. I call it 'Week Warrior.' 30 days aligns with the commonly cited habit formation period — after a month, the behaviour is starting to feel automatic. 'Monthly Master.' 100 days is the lifestyle milestone — at this point, the habit is integrated into your identity. 'Century Club.' The gaps between milestones get larger deliberately — early milestones come fast to build momentum, later ones require real commitment."

---

### Q25: "I see you have a 'Best Day of Week' chart. How does that help the user? What are they supposed to DO with that information?"

**What they're really testing:** Do your features have a purpose, or are they vanity metrics?

**Ideal answer:**
> "Honestly? This is the weakest feature in terms of actionability. It shows you which day you're most consistent, but you can't really change your best day — it's just an interesting insight. If I were to redesign it, I'd flip it: show which day you're LEAST consistent and prompt the user to set a stronger reminder for that day. That would make it actionable rather than just informational. This is something I'd improve with more time — every feature should answer the question 'what should the user do differently because of this?'"

---

## 🎯 BONUS: Meta-Questions They Might Ask

These aren't about the app — they're about YOU.

### "What would you do differently if you started over?"
> "I'd set up the data model and API layer first, then build the UI. I ended up refactoring my types and database schema twice. I'd also use React Query from the start for data fetching — I wrote a lot of manual loading/error state management that React Query handles out of the box."

### "What's one thing in this app you're genuinely proud of?"
> "The notification architecture. It's not the flashiest feature, but getting a renderless component to persist across all route changes, fire reminders at the right time, scope notifications per user, and update the navbar bell badge in real-time through a custom event system — that was a full-stack problem I solved end-to-end."

### "What's one thing you'd want to learn more about after this project?"
> "Testing. I didn't write unit tests or integration tests for this project because of the timeline, and I felt that gap. I'd want to learn how to test React hooks, mock Supabase calls, and write end-to-end tests with something like Playwright or Cypress. I know my streak calculation works because I tested it manually, but having automated tests would give me much more confidence to refactor."

### "You built this in a week with no prior TypeScript experience. What did that teach you?"
> "That you can learn faster than you think if you have a real project pushing you. I didn't learn TypeScript from a course — I learned it by getting compiler errors and fixing them. The type system actually accelerated development after the first day because autocomplete worked and bugs surfaced at compile time instead of at runtime. The biggest lesson: constraints — one week, new language — forced me to prioritise ruthlessly. I couldn't afford to gold-plate anything."

---

## 💡 How to Use This Document

> [!TIP]
> **Tonight and tomorrow morning:**
> 1. **Read each question out loud**, then answer it *without looking at the ideal answer*
> 2. Compare your answer to the ideal — note what you missed
> 3. Practice the ones you struggled with 2-3 more times
> 4. **Don't memorise word-for-word** — sound natural, not rehearsed
> 5. The ideal answers follow a formula: **WHAT → WHY → TRADE-OFF → WHAT I'D DO NEXT**

> [!IMPORTANT]
> **Key phrases to use during the interview:**
> - "I chose X over Y because..."
> - "The trade-off was..."
> - "With more time, I would..."
> - "I deliberately didn't..."
> - "That's a known limitation — here's how I'd fix it..."

> [!WARNING]
> **Things to AVOID saying:**
> - "The AI generated that for me" (say "I used AI tools to help, but I understand every piece")
> - "I don't know" alone (say "I haven't implemented that, but here's how I'd approach it")
> - "It just works" (always explain WHY it works)
> - Getting defensive about limitations (own them honestly, then pivot to what you'd improve)

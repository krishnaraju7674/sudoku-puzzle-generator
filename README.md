# AI Career OS

AI Career OS is a placement preparation dashboard for students. It helps users manage their profile, skills, resume feedback, readiness score, weekly tasks, job applications, and mock interview practice in one place.

## Features

- Email signup and login with Supabase Auth
- Profile page with college, branch, links, and target role
- Skills tracker with beginner, intermediate, and advanced levels
- Placement readiness score with category breakdown
- Resume analyzer for PDF resumes using keyword and section checks
- Career planner with daily and weekly preparation tasks
- Application tracker for jobs and internships
- Mock interview practice with answer scoring and session history

## Tech Stack

- React
- Vite
- Tailwind CSS
- Supabase
- PDF.js

## Run Locally

```bash
npm install
npm run dev
```

Create a `.env` file:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

Run the SQL in [supabase-setup.sql](./supabase-setup.sql) inside the Supabase SQL Editor. Then create or confirm the `resumes` storage bucket.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Project Status

MVP complete:

- Auth, profile, skills, readiness score, resume analyzer, planner, application tracker, and mock interview are implemented.
- Planner, applications, and interview history use browser storage per logged-in user, so they work even before extra database tables are added.

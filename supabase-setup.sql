-- AI Career OS Supabase setup
-- Run this in Supabase SQL Editor.

create table if not exists roles (
  id uuid default gen_random_uuid() primary key,
  role_name text not null unique,
  description text
);

create table if not exists skills (
  id uuid default gen_random_uuid() primary key,
  skill_name text not null unique,
  category text
);

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  college_name text,
  branch text,
  graduation_year int,
  current_year int,
  city text,
  github_url text,
  linkedin_url text,
  target_role_id uuid references roles(id),
  created_at timestamp default now()
);

create table if not exists user_skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  skill_id uuid references skills(id) on delete cascade not null,
  level text check (level in ('beginner', 'intermediate', 'advanced')),
  updated_at timestamp default now(),
  unique(user_id, skill_id)
);

create table if not exists resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  file_url text,
  extracted_text text,
  ats_score int,
  ai_feedback text,
  uploaded_at timestamp default now()
);

insert into roles (role_name, description) values
('Frontend Developer', 'Builds user interfaces using HTML, CSS, JavaScript and React'),
('Backend Developer', 'Builds servers, APIs and database-backed systems'),
('Full Stack Developer', 'Builds frontend and backend features end to end'),
('Data Analyst', 'Analyzes data using SQL, Python and visualization tools'),
('Java Developer', 'Builds applications using Java and backend frameworks'),
('Salesforce Developer', 'Builds CRM solutions on the Salesforce platform')
on conflict (role_name) do nothing;

insert into skills (skill_name, category) values
('HTML', 'Frontend'),
('CSS', 'Frontend'),
('JavaScript', 'Frontend'),
('React', 'Frontend'),
('Tailwind CSS', 'Frontend'),
('Node.js', 'Backend'),
('Express', 'Backend'),
('PostgreSQL', 'Database'),
('SQL', 'Database'),
('Python', 'Data'),
('Java', 'Language'),
('DSA', 'Core'),
('Aptitude', 'Core'),
('Communication', 'Soft Skills'),
('Git', 'Tools')
on conflict (skill_name) do nothing;

alter table roles enable row level security;
alter table skills enable row level security;
alter table profiles enable row level security;
alter table user_skills enable row level security;
alter table resumes enable row level security;

drop policy if exists "Public roles read" on roles;
drop policy if exists "Public skills read" on skills;
drop policy if exists "Users can read own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can read own skills" on user_skills;
drop policy if exists "Users can insert own skills" on user_skills;
drop policy if exists "Users can update own skills" on user_skills;
drop policy if exists "Users can delete own skills" on user_skills;
drop policy if exists "Users can read own resumes" on resumes;
drop policy if exists "Users can insert own resumes" on resumes;

create policy "Public roles read" on roles for select using (true);
create policy "Public skills read" on skills for select using (true);

create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can read own skills" on user_skills for select using (auth.uid() = user_id);
create policy "Users can insert own skills" on user_skills for insert with check (auth.uid() = user_id);
create policy "Users can update own skills" on user_skills for update using (auth.uid() = user_id);
create policy "Users can delete own skills" on user_skills for delete using (auth.uid() = user_id);

create policy "Users can read own resumes" on resumes for select using (auth.uid() = user_id);
create policy "Users can insert own resumes" on resumes for insert with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

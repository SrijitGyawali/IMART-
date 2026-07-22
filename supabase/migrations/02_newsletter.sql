-- Newsletter subscribers — run once in Supabase SQL Editor
create table newsletter_subscribers (
  id         uuid primary key default uuid_generate_v4(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

alter table newsletter_subscribers enable row level security;

-- Anyone can subscribe; only the admin can read the list
create policy "anon subscribe" on newsletter_subscribers
  for insert with check (true);

create policy "admin read subscribers" on newsletter_subscribers
  for select using (auth.role() = 'authenticated');

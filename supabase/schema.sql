-- VOIDSIGNL Database Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  banner_url text,
  bio text,
  status_text text,
  availability text,
  platforms text[] default '{}',
  socials jsonb default '{}',
  gamertags jsonb default '{}',
  is_verified boolean default false,
  is_founding_member boolean default false,
  is_coach boolean default false,
  is_onboarded boolean default false,
  xp integer default 0,
  level integer default 1,
  level_name text default 'Recruit',
  privacy_settings jsonb default '{
    "show_gamertags": "everyone",
    "show_stats": "everyone",
    "show_clips": "everyone",
    "show_socials": "everyone",
    "show_availability": "everyone"
  }',
  preferred_language text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- GAMES
-- ============================================
create table public.games (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  cover_url text,
  description text,
  is_approved boolean default false,
  suggested_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ============================================
-- USER GAMES (which games a user plays)
-- ============================================
create table public.user_games (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  game_id uuid references public.games(id) on delete cascade not null,
  is_main boolean default false,
  created_at timestamptz default now(),
  unique(user_id, game_id)
);

-- ============================================
-- POSTS
-- ============================================
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  video_url text,
  game_id uuid references public.games(id),
  like_count integer default 0,
  comment_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- LIKES
-- ============================================
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);

-- ============================================
-- COMMENTS
-- ============================================
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- ============================================
-- FOLLOWS
-- ============================================
create table public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

-- ============================================
-- BUDDY REQUESTS
-- ============================================
create table public.buddy_requests (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(sender_id, receiver_id)
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text,
  is_read boolean default false,
  link text,
  created_at timestamptz default now()
);

-- ============================================
-- CLIPS (special posts for video clips)
-- ============================================
create table public.clips (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  video_url text not null,
  thumbnail_url text,
  game_id uuid references public.games(id),
  is_pinned boolean default false,
  is_cotw boolean default false,
  like_count integer default 0,
  view_count integer default 0,
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_profiles_username on public.profiles(username);
create index idx_posts_user_id on public.posts(user_id);
create index idx_posts_game_id on public.posts(game_id);
create index idx_posts_created_at on public.posts(created_at desc);
create index idx_comments_post_id on public.comments(post_id);
create index idx_likes_post_id on public.likes(post_id);
create index idx_likes_user_id on public.likes(user_id);
create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);
create index idx_notifications_user on public.notifications(user_id, is_read);
create index idx_user_games_user on public.user_games(user_id);
create index idx_clips_user on public.clips(user_id);
create index idx_clips_game on public.clips(game_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.user_games enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.buddy_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.clips enable row level security;

-- Profiles: anyone can read, users can update own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Games: anyone can read approved, authenticated can suggest
create policy "Approved games are viewable" on public.games for select using (is_approved = true);
create policy "Authenticated users can suggest games" on public.games for insert with check (auth.role() = 'authenticated');

-- User games: anyone can read, users manage own
create policy "User games are viewable" on public.user_games for select using (true);
create policy "Users can manage own games" on public.user_games for insert with check (auth.uid() = user_id);
create policy "Users can delete own games" on public.user_games for delete using (auth.uid() = user_id);

-- Posts: anyone can read, users manage own
create policy "Posts are viewable by everyone" on public.posts for select using (true);
create policy "Users can create posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on public.posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts" on public.posts for delete using (auth.uid() = user_id);

-- Likes: anyone can read, users manage own
create policy "Likes are viewable" on public.likes for select using (true);
create policy "Users can like" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on public.likes for delete using (auth.uid() = user_id);

-- Comments: anyone can read, users manage own
create policy "Comments are viewable" on public.comments for select using (true);
create policy "Users can comment" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- Follows: anyone can read, users manage own
create policy "Follows are viewable" on public.follows for select using (true);
create policy "Users can follow" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.follows for delete using (auth.uid() = follower_id);

-- Buddy requests: participants can read, sender can create
create policy "Buddy requests viewable by participants" on public.buddy_requests for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send buddy requests" on public.buddy_requests for insert with check (auth.uid() = sender_id);
create policy "Receiver can update buddy request" on public.buddy_requests for update using (auth.uid() = receiver_id);

-- Notifications: users read own
create policy "Users can read own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- Clips: anyone can read, users manage own
create policy "Clips are viewable" on public.clips for select using (true);
create policy "Users can upload clips" on public.clips for insert with check (auth.uid() = user_id);
create policy "Users can update own clips" on public.clips for update using (auth.uid() = user_id);
create policy "Users can delete own clips" on public.clips for delete using (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update like count
create or replace function public.handle_like_change()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.posts set like_count = like_count - 1 where id = old.post_id;
    return old;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_like_change
  after insert or delete on public.likes
  for each row execute procedure public.handle_like_change();

-- Update comment count
create or replace function public.handle_comment_change()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.posts set comment_count = comment_count - 1 where id = old.post_id;
    return old;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute procedure public.handle_comment_change();

-- Add XP function
create or replace function public.add_xp(user_uuid uuid, amount integer)
returns void as $$
declare
  new_xp integer;
  new_level integer;
  new_level_name text;
begin
  update public.profiles set xp = xp + amount where id = user_uuid returning xp into new_xp;
  
  select
    case
      when new_xp >= 12000 then 10
      when new_xp >= 8000 then 9
      when new_xp >= 5000 then 8
      when new_xp >= 3000 then 7
      when new_xp >= 1800 then 6
      when new_xp >= 1000 then 5
      when new_xp >= 600 then 4
      when new_xp >= 300 then 3
      when new_xp >= 100 then 2
      else 1
    end,
    case
      when new_xp >= 12000 then 'Legend'
      when new_xp >= 8000 then 'Grandmaster'
      when new_xp >= 5000 then 'Master'
      when new_xp >= 3000 then 'Champion'
      when new_xp >= 1800 then 'Elite'
      when new_xp >= 1000 then 'Veteran'
      when new_xp >= 600 then 'Regular'
      when new_xp >= 300 then 'Member'
      when new_xp >= 100 then 'Initiate'
      else 'Recruit'
    end
  into new_level, new_level_name;
  
  update public.profiles set level = new_level, level_name = new_level_name where id = user_uuid;
end;
$$ language plpgsql security definer;

-- ============================================
-- SEED DATA: Initial games
-- ============================================
insert into public.games (name, slug, is_approved) values
  ('Call of Duty: Warzone', 'warzone', true),
  ('Valorant', 'valorant', true),
  ('Apex Legends', 'apex-legends', true),
  ('Fortnite', 'fortnite', true),
  ('League of Legends', 'league-of-legends', true),
  ('Counter-Strike 2', 'cs2', true),
  ('Rocket League', 'rocket-league', true),
  ('Overwatch 2', 'overwatch-2', true),
  ('Rainbow Six Siege', 'rainbow-six-siege', true),
  ('FIFA / EA FC', 'ea-fc', true);

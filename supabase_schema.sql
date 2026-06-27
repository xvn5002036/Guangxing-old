-- ==========================================
-- 1. EXTENSIONS & UTILITIES
-- ==========================================
create extension if not exists "uuid-ossp";

-- Helper Function: Check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

-- Helper Function: Update updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- ==========================================
-- 2. TABLE DEFINITIONS (User Provided Schema)
-- ==========================================

CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content text NOT NULL,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  link text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT announcements_pkey PRIMARY KEY (id)
);

CREATE TABLE public.bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id text NOT NULL,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.digital_products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  category text DEFAULT '道藏藏書'::text,
  price numeric NOT NULL DEFAULT 0,
  file_path text,
  preview_url text,
  file_type text DEFAULT 'HTML'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  author text,
  content text,
  attachments jsonb DEFAULT '[]'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  is_limited_time boolean DEFAULT false,
  promotion_end_date timestamp with time zone,
  CONSTRAINT digital_products_pkey PRIMARY KEY (id)
);

CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  end_date date,
  lunar_date text,
  lunar_end_date text,
  title text NOT NULL,
  description text,
  time text,
  type text CHECK (type = ANY (ARRAY['FESTIVAL'::text, 'RITUAL'::text, 'SERVICE'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  field_config jsonb,
  CONSTRAINT events_pkey PRIMARY KEY (id)
);

CREATE TABLE public.faqs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT faqs_pkey PRIMARY KEY (id)
);

CREATE TABLE public.gallery_albums (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  cover_image_url text,
  event_date date,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT gallery_albums_pkey PRIMARY KEY (id)
);

CREATE TABLE public.gallery (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  type text CHECK (type = ANY (ARRAY['IMAGE'::text, 'VIDEO'::text, 'YOUTUBE'::text])),
  url text NOT NULL,
  title text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  album_id uuid,
  CONSTRAINT gallery_pkey PRIMARY KEY (id),
  CONSTRAINT gallery_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.gallery_albums(id)
);

CREATE TABLE public.news (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  title text NOT NULL,
  category text,
  content text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT news_pkey PRIMARY KEY (id)
);

CREATE TABLE public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id text NOT NULL,
  content text NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT notes_pkey PRIMARY KEY (id),
  CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  product_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'PAID'::text, 'FAILED'::text, 'CANCELLED'::text])),
  merchant_trade_no text NOT NULL UNIQUE,
  payment_type text,
  payment_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES public.digital_products(id)
);

CREATE TABLE public.org_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  title text NOT NULL,
  image text,
  category text CHECK (category = ANY (ARRAY['LEADER'::text, 'EXECUTIVE'::text, 'STAFF'::text])),
  order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT org_members_pkey PRIMARY KEY (id)
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  phone text,
  birth_year text,
  birth_month text,
  birth_day text,
  birth_hour text,
  city text,
  district text,
  address text,
  gender text DEFAULT 'M'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  role text DEFAULT 'user'::text CHECK (role = ANY (ARRAY['admin'::text, 'user'::text])),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

COMMENT ON COLUMN public.profiles.gender IS 'Gender of the user (M=Male/乾造, F=Female/坤造)';

CREATE TABLE public.purchases (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  product_id uuid,
  order_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT purchases_pkey PRIMARY KEY (id),
  CONSTRAINT purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT purchases_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.digital_products(id),
  CONSTRAINT purchases_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);

CREATE TABLE public.registrations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  service_id uuid,
  service_title text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  birth_year text,
  birth_month text,
  birth_day text,
  birth_hour text,
  city text,
  district text,
  road text,
  address_detail text,
  gender text,
  amount numeric NOT NULL,
  status text DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PAID'::text, 'PENDING'::text, 'CANCELLED'::text])),
  is_processed boolean DEFAULT false,
  payment_method text,
  payment_details text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  user_id uuid,
  bank_last_five text,
  id_number text,
  CONSTRAINT registrations_pkey PRIMARY KEY (id),
  CONSTRAINT registrations_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

COMMENT ON COLUMN public.registrations.gender IS 'Gender of the registrant (M/F)';

CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  icon_name text,
  price numeric,
  type text CHECK (type = ANY (ARRAY['LIGHT'::text, 'DONATION'::text, 'RITUAL'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  field_config jsonb,
  CONSTRAINT services_pkey PRIMARY KEY (id)
);

CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  temple_name text DEFAULT '新莊武壇廣行宮'::text,
  address text,
  phone text,
  line_url text,
  hero_title text,
  hero_subtitle text,
  hero_image text,
  deity_image text,
  deity_title text,
  deity_intro text,
  deity_birthday text,
  deity_birthday_label text,
  deity_duty text,
  deity_duty_label text,
  history_image_roof text,
  history_roof_title text,
  history_roof_desc text,
  history_image_stone text,
  history_stone_title text,
  history_stone_desc text,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  history_title1 text,
  history_desc1 text,
  history_title2 text,
  history_desc2 text,
  history_title3 text,
  history_desc3 text,
  config_donation jsonb,
  config_light jsonb,
  config_event jsonb,
  CONSTRAINT site_settings_pkey PRIMARY KEY (id)
);

-- ==========================================
-- 3. INDEXES
-- ==========================================
-- Extra index for tags (not in user DDL but useful/good practice)
create index if not exists idx_digital_products_tags on digital_products using gin(tags);

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.registrations enable row level security;
alter table public.news enable row level security;
alter table public.events enable row level security;
alter table public.gallery enable row level security;
alter table public.gallery_albums enable row level security;
alter table public.org_members enable row level security;
alter table public.faqs enable row level security;
alter table public.site_settings enable row level security;
alter table public.digital_products enable row level security;
alter table public.announcements enable row level security;
alter table public.orders enable row level security;
alter table public.purchases enable row level security;
alter table public.bookmarks enable row level security;
alter table public.notes enable row level security;
alter table public.notifications enable row level security;

-- 4.1 Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (public.is_admin());

-- 4.2 Services, News, Events, Gallery, Org, FAQs, Settings, Digital Products
-- (Public Read, Admin Write)
create policy "Public can view services" on public.services for select using (true);
create policy "Admins can manage services" on public.services for all using (public.is_admin());

create policy "Public can view news" on public.news for select using (true);
create policy "Admins can manage news" on public.news for all using (public.is_admin());

create policy "Public can view events" on public.events for select using (true);
create policy "Admins can manage events" on public.events for all using (public.is_admin());

create policy "Public can view gallery" on public.gallery for select using (true);
create policy "Admins can manage gallery" on public.gallery for all using (public.is_admin());
create policy "Public can view albums" on public.gallery_albums for select using (true);
create policy "Admins can manage albums" on public.gallery_albums for all using (public.is_admin());

create policy "Public can view members" on public.org_members for select using (true);
create policy "Admins can manage members" on public.org_members for all using (public.is_admin());

create policy "Public can view faqs" on public.faqs for select using (true);
create policy "Admins can manage faqs" on public.faqs for all using (public.is_admin());

create policy "Public can view settings" on public.site_settings for select using (true);
create policy "Admins can manage settings" on public.site_settings for all using (public.is_admin());

create policy "Public can view digital products" on public.digital_products for select using (true);
create policy "Admins can manage digital products" on public.digital_products for all using (public.is_admin());

create policy "Public can view announcements" on public.announcements for select using (true);
create policy "Admins can manage announcements" on public.announcements for all using (public.is_admin());

-- 4.3 Registrations
create policy "Users can view own registrations" on public.registrations for select using (auth.uid() = user_id or public.is_admin());
create policy "Users can insert own registrations" on public.registrations for insert with check (auth.uid() = user_id or public.is_admin());
create policy "Admins can update registrations" on public.registrations for update using (public.is_admin());
create policy "Admins can delete registrations" on public.registrations for delete using (public.is_admin());

-- 4.4 Orders & Purchases
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id or public.is_admin());
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id or public.is_admin());
create policy "Admins can manage orders" on public.orders for all using (public.is_admin());

create policy "Users can view own purchases" on public.purchases for select using (auth.uid() = user_id or public.is_admin());
create policy "Admins can manage purchases" on public.purchases for all using (public.is_admin());

-- 4.5 Bookmarks
create policy "Users can view own bookmarks" on public.bookmarks for select using (auth.uid() = user_id);
create policy "Users can manage bookmarks" on public.bookmarks for all using (auth.uid() = user_id);

-- 4.6 Notes
create policy "Users can view own notes" on public.notes for select using (auth.uid() = user_id);
create policy "Users can view public notes" on public.notes for select using (is_public = true);
create policy "Users can manage own notes" on public.notes for all using (auth.uid() = user_id);

-- 4.7 Notifications
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "Admins can manage notifications" on public.notifications for all using (public.is_admin());

-- ==========================================
-- 5. REALTIME & TRIGGERS
-- ==========================================

-- 5.1 Realtime Publication
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table services;
alter publication supabase_realtime add table news;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table gallery;
alter publication supabase_realtime add table gallery_albums;
alter publication supabase_realtime add table org_members;
alter publication supabase_realtime add table registrations;
alter publication supabase_realtime add table site_settings;
alter publication supabase_realtime add table faqs;
alter publication supabase_realtime add table digital_products;
alter publication supabase_realtime add table announcements;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table purchases;
alter publication supabase_realtime add table bookmarks;
alter publication supabase_realtime add table notes;
alter publication supabase_realtime add table notifications;

-- 5.2 Auto-Create Profile Trigger
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5.3 Updated At Triggers
drop trigger if exists update_bookmarks_updated_at on bookmarks;
create trigger update_bookmarks_updated_at
    before update on bookmarks
    for each row
    execute procedure update_updated_at_column();

drop trigger if exists update_notes_updated_at on notes;
create trigger update_notes_updated_at
    before update on notes
    for each row
    execute procedure update_updated_at_column();

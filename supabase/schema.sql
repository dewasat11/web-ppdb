-- Tabel sections (daftar blok konten CRUD)
create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (length(slug) > 0),
  updated_at timestamptz not null default now()
);

-- Tabel terjemahan per bahasa
create table if not exists section_translations (
  section_id uuid references sections(id) on delete cascade,
  locale text not null check (locale in ('id','en')),
  title text,
  body text,
  updated_at timestamptz not null default now(),
  primary key (section_id, locale)
);

-- Aktifkan RLS
alter table sections enable row level security;
alter table section_translations enable row level security;

-- Baca publik (opsional; akses utama via server)
create policy if not exists "read_sections_public" on sections
for select using (true);

create policy if not exists "read_section_translations_public" on section_translations
for select using (true);

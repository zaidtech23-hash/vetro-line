-- ═══════════════════════════════════════════════════════════════
-- VetroLine — UPGRADE Sprint 4
-- ═══════════════════════════════════════════════════════════════
-- Adiciona: Sistema de notificações pro chefe
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  recipient_role text,
  
  type text not null,
  title text not null,
  message text,
  
  related_id uuid,
  related_type text,
  
  read boolean default false,
  read_at timestamptz,
  
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_notif_org on public.notifications(organization_id);
create index if not exists idx_notif_recipient on public.notifications(recipient_id);
create index if not exists idx_notif_role on public.notifications(recipient_role);
create index if not exists idx_notif_read on public.notifications(read);
create index if not exists idx_notif_created on public.notifications(created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notif_recipient_read" on public.notifications;
create policy "notif_recipient_read" on public.notifications
  for select using (
    organization_id = public.current_org_id()
    and (
      recipient_id = auth.uid()
      or recipient_role = public.current_user_role()
      or recipient_role = 'admin' and public.current_user_role() in ('admin','manager')
    )
  );

drop policy if exists "notif_recipient_update" on public.notifications;
create policy "notif_recipient_update" on public.notifications
  for update using (
    organization_id = public.current_org_id()
    and (
      recipient_id = auth.uid()
      or recipient_role = public.current_user_role()
      or recipient_role = 'admin' and public.current_user_role() in ('admin','manager')
    )
  );

drop policy if exists "notif_create" on public.notifications;
create policy "notif_create" on public.notifications
  for insert with check (organization_id = public.current_org_id());

-- ═══════════════════════════════════════════════════════════════
-- PRONTO!
-- ═══════════════════════════════════════════════════════════════

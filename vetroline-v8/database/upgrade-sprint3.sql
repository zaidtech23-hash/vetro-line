-- ═══════════════════════════════════════════════════════════════
-- VetroLine — UPGRADE Sprint 3
-- ═══════════════════════════════════════════════════════════════
-- Adiciona: Configurações, Cortes de Alumínio, Agenda
-- 
-- NÃO APAGA NADA! Só adiciona coisas novas.
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────
-- 1. TABELA DE CONFIGURAÇÕES DA VIDRAÇARIA
-- ───────────────────────────────────────────────
create table if not exists public.org_settings (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade unique,
  
  -- Preços de alumínio
  aluminio_branco_metro numeric(10,2) default 0,
  aluminio_preto_metro numeric(10,2) default 0,
  aluminio_bronze_metro numeric(10,2) default 0,
  aluminio_fosco_metro numeric(10,2) default 0,
  
  -- Peso da barra
  peso_barra_6m numeric(10,2) default 0,
  peso_barra_3m numeric(10,2) default 0,
  
  -- Preços de serviços
  preco_janela numeric(10,2) default 0,
  preco_porta numeric(10,2) default 0,
  preco_box numeric(10,2) default 0,
  preco_espelho numeric(10,2) default 0,
  preco_espelho_led numeric(10,2) default 0,
  preco_vitrine numeric(10,2) default 0,
  preco_porta_correr numeric(10,2) default 0,
  preco_mao_obra_hora numeric(10,2) default 0,
  
  -- Outros
  fornecedor_principal text,
  observacoes text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_settings_updated before update on public.org_settings 
  for each row execute function public.set_updated_at();

alter table public.org_settings enable row level security;

drop policy if exists "settings_org_access" on public.org_settings;
create policy "settings_org_access" on public.org_settings
  for all using (organization_id = public.current_org_id());

-- Cria configuração padrão pra organização demo
insert into public.org_settings (organization_id) 
values ('00000000-0000-0000-0000-000000000001')
on conflict (organization_id) do nothing;

-- ───────────────────────────────────────────────
-- 2. TABELA DE CORTES DE ALUMÍNIO
-- ───────────────────────────────────────────────
create table if not exists public.cuts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_order_id uuid references public.service_orders(id) on delete cascade,
  
  material text not null,
  cor text,
  comprimento numeric(10,2) not null,
  quantidade integer not null default 1,
  observacoes text,
  done boolean default false,
  done_at timestamptz,
  done_by uuid references public.profiles(id) on delete set null,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_cuts_org on public.cuts(organization_id);
create index if not exists idx_cuts_os on public.cuts(service_order_id);

create trigger trg_cuts_updated before update on public.cuts 
  for each row execute function public.set_updated_at();

alter table public.cuts enable row level security;

drop policy if exists "cuts_admin_all" on public.cuts;
create policy "cuts_admin_all" on public.cuts
  for all using (
    organization_id = public.current_org_id()
    and public.current_user_role() in ('admin', 'manager')
  );

drop policy if exists "cuts_worker_read" on public.cuts;
create policy "cuts_worker_read" on public.cuts
  for select using (
    organization_id = public.current_org_id()
  );

-- Funcionário pode marcar corte como feito
drop policy if exists "cuts_worker_update" on public.cuts;
create policy "cuts_worker_update" on public.cuts
  for update using (
    organization_id = public.current_org_id()
  );

-- ───────────────────────────────────────────────
-- 3. CAMPO "CHECKLIST" NA OS (já existe, mas garantir)
-- ───────────────────────────────────────────────
alter table public.service_orders 
  add column if not exists checklist jsonb default '[]'::jsonb;

-- ───────────────────────────────────────────────
-- 4. CAMPO "AGENDADO PARA" NA OS
-- ───────────────────────────────────────────────
alter table public.service_orders 
  add column if not exists scheduled_at timestamptz;

create index if not exists idx_orders_scheduled on public.service_orders(scheduled_at);

-- ═══════════════════════════════════════════════════════════════
-- PRONTO!
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- VetroLine — UPGRADE Sprint 7
-- ═══════════════════════════════════════════════════════════════
-- Adiciona campos pro orçamento rápido do funcionário
-- ═══════════════════════════════════════════════════════════════

-- Adicionar campos ao orçamento pra cliente "rascunho"
alter table public.quotes 
  add column if not exists client_name_temp text,
  add column if not exists client_phone_temp text,
  add column if not exists client_address_temp text,
  add column if not exists service_type text,
  add column if not exists measurements text,
  add column if not exists photos jsonb default '[]'::jsonb,
  add column if not exists created_by_role text;

-- Status novos: pending_review (chefe revisa), approved (chefe aprovou)
-- Já existem: draft, sent, accepted, rejected, converted
-- Vamos usar: 'pending_review' = pendente de aprovação do chefe

-- ═══════════════════════════════════════════════════════════════
-- ENTRADAS DE ESTOQUE (registro de cada chegada)
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.inventory_entries (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  quantity numeric(10,2) not null,
  observations text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_inventory_entries_org on public.inventory_entries(organization_id);
create index if not exists idx_inventory_entries_item on public.inventory_entries(inventory_item_id);

alter table public.inventory_entries enable row level security;

drop policy if exists "inventory_entries_org_access" on public.inventory_entries;
create policy "inventory_entries_org_access" on public.inventory_entries
  for all using (organization_id = public.current_org_id());

-- ═══════════════════════════════════════════════════════════════
-- BUCKET DE FOTOS DE ORÇAMENTO
-- ═══════════════════════════════════════════════════════════════
-- Vai precisar criar manual: 'quote-photos' como bucket público

-- ═══════════════════════════════════════════════════════════════
-- PRONTO!
-- ═══════════════════════════════════════════════════════════════

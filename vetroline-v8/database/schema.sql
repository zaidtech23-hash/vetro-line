-- ═══════════════════════════════════════════════════════════════
-- VetroLine — Schema Completo do Banco de Dados
-- ═══════════════════════════════════════════════════════════════
-- Sistema multi-tenant para gestão de vidraçarias/esquadrias
-- 
-- COMO USAR:
-- 1. Abre o Supabase
-- 2. Vai em SQL Editor
-- 3. Cola este arquivo INTEIRO
-- 4. Clica em Run
-- 5. Pronto — banco configurado em 5 segundos
--
-- Pode rodar quantas vezes quiser — o script reseta tudo antes.
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────
-- RESET (apaga tudo da versão anterior)
-- ───────────────────────────────────────────────
drop table if exists public.quote_items cascade;
drop table if exists public.transactions cascade;
drop table if exists public.quotes cascade;
drop table if exists public.service_orders cascade;
drop table if exists public.inventory_items cascade;
drop table if exists public.products cascade;
drop table if exists public.clients cascade;
drop table if exists public.profiles cascade;
drop table if exists public.organizations cascade;
drop function if exists public.current_org_id() cascade;
drop function if exists public.current_user_role() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.handle_new_user() cascade;

-- ───────────────────────────────────────────────
-- EXTENSÕES
-- ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- TABELAS
-- ═══════════════════════════════════════════════════════════════

-- 1. ORGANIZATIONS (cada vidraçaria assinante)
create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  cnpj text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  logo_url text,
  plan text default 'trial' check (plan in ('trial','basic','pro','enterprise')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. PROFILES (usuários da vidraçaria)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  role text not null default 'worker' check (role in ('admin','manager','worker')),
  phone text,
  avatar_url text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_profiles_org on public.profiles(organization_id);

-- 3. CLIENTS (clientes da vidraçaria)
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  cpf_cnpj text,
  address text,
  city text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_clients_org on public.clients(organization_id);

-- 4. PRODUCTS (catálogo)
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  category text,
  unit text default 'un',
  price numeric(10,2) not null default 0,
  cost numeric(10,2) default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_products_org on public.products(organization_id);

-- 5. INVENTORY_ITEMS (estoque)
create table public.inventory_items (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text,
  name text not null,
  category text,
  unit text default 'un',
  quantity numeric(10,2) default 0,
  min_quantity numeric(10,2) default 0,
  cost_per_unit numeric(10,2) default 0,
  supplier text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_inventory_org on public.inventory_items(organization_id);

-- 6. SERVICE_ORDERS (Ordens de Serviço)
create table public.service_orders (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  os_number text,
  client_id uuid references public.clients(id) on delete set null,
  worker_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending','in_production','in_field','done','canceled')),
  priority text default 'normal' check (priority in ('low','normal','high','urgent')),
  due_date date,
  total numeric(10,2) default 0,
  checklist jsonb default '[]'::jsonb,
  photos jsonb default '[]'::jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_orders_org on public.service_orders(organization_id);
create index idx_orders_status on public.service_orders(status);
create index idx_orders_worker on public.service_orders(worker_id);

-- 7. QUOTES (orçamentos)
create table public.quotes (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  quote_number text,
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','sent','accepted','rejected','converted')),
  subtotal numeric(10,2) default 0,
  labor_cost numeric(10,2) default 0,
  discount numeric(10,2) default 0,
  total numeric(10,2) default 0,
  payment_method text,
  delivery_days integer,
  valid_until date,
  notes text,
  pdf_url text,
  service_order_id uuid references public.service_orders(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_quotes_org on public.quotes(organization_id);

-- 8. QUOTE_ITEMS (itens dentro do orçamento)
create table public.quote_items (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(10,2) not null default 0,
  total numeric(10,2) generated always as (quantity * unit_price) stored,
  position integer default 0,
  created_at timestamptz default now()
);
create index idx_quote_items_quote on public.quote_items(quote_id);

-- 9. TRANSACTIONS (financeiro)
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  category text,
  description text not null,
  amount numeric(10,2) not null,
  occurred_at date not null default current_date,
  service_order_id uuid references public.service_orders(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_transactions_org on public.transactions(organization_id);
create index idx_transactions_date on public.transactions(occurred_at);

-- ═══════════════════════════════════════════════════════════════
-- FUNÇÕES HELPER
-- ═══════════════════════════════════════════════════════════════

-- Pega organization_id do usuário logado
create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- Pega papel do usuário logado
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS DE updated_at
-- ═══════════════════════════════════════════════════════════════
create trigger trg_orgs_updated before update on public.organizations for each row execute function public.set_updated_at();
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_clients_updated before update on public.clients for each row execute function public.set_updated_at();
create trigger trg_products_updated before update on public.products for each row execute function public.set_updated_at();
create trigger trg_inventory_updated before update on public.inventory_items for each row execute function public.set_updated_at();
create trigger trg_orders_updated before update on public.service_orders for each row execute function public.set_updated_at();
create trigger trg_quotes_updated before update on public.quotes for each row execute function public.set_updated_at();
create trigger trg_transactions_updated before update on public.transactions for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (Multi-Tenant)
-- ═══════════════════════════════════════════════════════════════
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.inventory_items enable row level security;
alter table public.service_orders enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.transactions enable row level security;

-- ORGANIZATIONS
create policy "users_see_own_org" on public.organizations for select using (id = public.current_org_id());
create policy "admins_update_own_org" on public.organizations for update using (id = public.current_org_id() and public.current_user_role() = 'admin');

-- PROFILES
create policy "see_org_profiles" on public.profiles for select using (organization_id = public.current_org_id());
create policy "update_own_profile" on public.profiles for update using (id = auth.uid());
create policy "admin_manage_profiles" on public.profiles for all using (organization_id = public.current_org_id() and public.current_user_role() in ('admin','manager'));

-- CLIENTS
create policy "org_clients_all" on public.clients for all using (organization_id = public.current_org_id());

-- PRODUCTS
create policy "org_products_all" on public.products for all using (organization_id = public.current_org_id());

-- INVENTORY
create policy "org_inventory_all" on public.inventory_items for all using (organization_id = public.current_org_id());

-- SERVICE ORDERS
create policy "org_orders_all" on public.service_orders for all using (organization_id = public.current_org_id());

-- QUOTES
create policy "org_quotes_all" on public.quotes for all using (organization_id = public.current_org_id());

-- QUOTE ITEMS
create policy "org_quote_items_all" on public.quote_items for all using (
  exists (select 1 from public.quotes q where q.id = quote_items.quote_id and q.organization_id = public.current_org_id())
);

-- TRANSACTIONS
create policy "org_transactions_all" on public.transactions for all using (organization_id = public.current_org_id());

-- ═══════════════════════════════════════════════════════════════
-- DADOS DE TESTE (Vidraçaria Demo)
-- ═══════════════════════════════════════════════════════════════
insert into public.organizations (id, name, cnpj, phone, email, plan) values
  ('00000000-0000-0000-0000-000000000001','Vidraçaria Demo','00.000.000/0001-00','(49) 99999-0000','contato@vidracaria.com','trial');

-- Clientes
insert into public.clients (organization_id, name, phone, email, address, city) values
  ('00000000-0000-0000-0000-000000000001','Marcos Pereira','(49) 99111-1111','marcos@email.com','Rua das Flores, 45 — Centro','Chapecó'),
  ('00000000-0000-0000-0000-000000000001','Ana Rodrigues','(49) 99222-2222','ana@email.com','Av. Central, 210 — Bairro Sul','Chapecó'),
  ('00000000-0000-0000-0000-000000000001','Loja Moda Sul','(49) 99333-3333','contato@modasul.com','Rua do Comércio, 88 — Centro','Chapecó'),
  ('00000000-0000-0000-0000-000000000001','Pedro Souza','(49) 99444-4444','pedro@email.com','Rua Verde, 120 — Jardim','Chapecó');

-- Produtos
insert into public.products (organization_id, name, description, category, unit, price, cost) values
  ('00000000-0000-0000-0000-000000000001','Janela Maxim-ar 1 módulo 45/90','Janela basculante em alumínio','janela','un', 550.33, 228.49),
  ('00000000-0000-0000-0000-000000000001','Porta de Correr 5 folhas','Porta correr com 5 folhas em vidro temperado','porta','un', 7561.81, 4232.50),
  ('00000000-0000-0000-0000-000000000001','Box de Banheiro 8mm','Box vidro temperado 8mm com perfis','box','m2', 480.00, 220.00),
  ('00000000-0000-0000-0000-000000000001','Espelho 4mm','Espelho prata de 4mm','espelho','m2', 220.00, 95.00),
  ('00000000-0000-0000-0000-000000000001','Mão de obra instalação','Serviço de instalação por hora','servico','h', 80.00, 0);

-- Estoque
insert into public.inventory_items (organization_id, code, name, category, unit, quantity, min_quantity, cost_per_unit, supplier) values
  ('00000000-0000-0000-0000-000000000001','ALU-001','Perfil 6m — Linha Suprema','aluminio','barra', 24, 5, 145.00, 'Alcoa'),
  ('00000000-0000-0000-0000-000000000001','ALU-002','Perfil 6m — Linha Gold III','aluminio','barra', 4, 5, 198.00, 'Alcoa'),
  ('00000000-0000-0000-0000-000000000001','ALU-015','Perfil Trilho de Embutir','aluminio','barra', 12, 3, 88.00, 'CBA'),
  ('00000000-0000-0000-0000-000000000001','VID-001','Vidro Temperado 6mm Incolor','vidro','m2', 18, 5, 95.00, 'Cebrace'),
  ('00000000-0000-0000-0000-000000000001','VID-003','Vidro Mini Boreal 4mm','vidro','m2', 9, 5, 78.00, 'Guardian'),
  ('00000000-0000-0000-0000-000000000001','VID-005','Vidro Jateado 6mm','vidro','m2', 3, 5, 110.00, 'Cebrace');

-- Algumas Ordens de Serviço de exemplo
insert into public.service_orders (organization_id, os_number, client_id, title, description, status, priority, due_date, total)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  'OS-2026-001',
  c.id,
  'Box vidro 8mm — Banheiro suíte',
  'Instalação de box em vidro temperado 8mm com perfis cromados',
  'done',
  'normal',
  current_date - 5,
  1450.00
from public.clients c where c.name = 'Marcos Pereira' and c.organization_id = '00000000-0000-0000-0000-000000000001';

insert into public.service_orders (organization_id, os_number, client_id, title, description, status, priority, due_date, total)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  'OS-2026-002',
  c.id,
  'Esquadria alumínio — sala',
  'Janela maxim-ar 2 módulos com vidro mini boreal',
  'in_field',
  'high',
  current_date,
  2890.00
from public.clients c where c.name = 'Ana Rodrigues' and c.organization_id = '00000000-0000-0000-0000-000000000001';

insert into public.service_orders (organization_id, os_number, client_id, title, description, status, priority, due_date, total)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  'OS-2026-003',
  c.id,
  'Vitrine loja',
  'Vitrine de vidro temperado 10mm com fechadura',
  'pending',
  'urgent',
  current_date + 1,
  4200.00
from public.clients c where c.name = 'Loja Moda Sul' and c.organization_id = '00000000-0000-0000-0000-000000000001';

-- Algumas transações financeiras
insert into public.transactions (organization_id, type, category, description, amount, occurred_at) values
  ('00000000-0000-0000-0000-000000000001','income','obra','Pagamento OS-2026-001 — Marcos Pereira', 1450.00, current_date - 4),
  ('00000000-0000-0000-0000-000000000001','income','sinal','Sinal OS-2026-002 — Ana Rodrigues', 1000.00, current_date - 2),
  ('00000000-0000-0000-0000-000000000001','expense','aluminio','Compra perfil alumínio — Alcoa', 3200.00, current_date - 7),
  ('00000000-0000-0000-0000-000000000001','expense','vidro','Compra vidro temperado — Cebrace', 1800.00, current_date - 5),
  ('00000000-0000-0000-0000-000000000001','expense','salario','Salário funcionários (50%)', 4500.00, current_date - 1);

-- ═══════════════════════════════════════════════════════════════
-- FIM! Schema completo. Próximo passo: criar usuário em Auth
-- e linkar à organização com este SQL:
--
-- insert into public.profiles (id, organization_id, name, role, phone)
-- select id, '00000000-0000-0000-0000-000000000001'::uuid, 'Seu Nome', 'admin', '(49) 00000-0000'
-- from auth.users where email = 'seuemail@aqui.com';
-- ═══════════════════════════════════════════════════════════════

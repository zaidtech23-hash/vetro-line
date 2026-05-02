-- ═══════════════════════════════════════════════════════════════
-- VetroLine — UPGRADE Sprint 2 (parte 1)
-- ═══════════════════════════════════════════════════════════════
-- Adiciona funcionalidades novas SEM apagar os dados existentes!
-- 
-- Como rodar:
-- 1. Abre o Supabase → SQL Editor → New query
-- 2. Cola TUDO
-- 3. Run
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────
-- 1. CRIAR BUCKET DE STORAGE PARA FOTOS
-- ───────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('os-photos', 'os-photos', true)
on conflict (id) do nothing;

-- Política: usuários autenticados podem fazer upload
drop policy if exists "auth_upload_photos" on storage.objects;
create policy "auth_upload_photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'os-photos');

-- Política: qualquer um pode ver fotos (bucket público)
drop policy if exists "public_view_photos" on storage.objects;
create policy "public_view_photos"
on storage.objects for select
to public
using (bucket_id = 'os-photos');

-- Política: usuários autenticados podem deletar fotos
drop policy if exists "auth_delete_photos" on storage.objects;
create policy "auth_delete_photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'os-photos');

-- ───────────────────────────────────────────────
-- 2. ATUALIZAR RLS DAS OS - FUNCIONÁRIO SÓ VÊ AS DELE
-- ───────────────────────────────────────────────

-- Apaga política antiga
drop policy if exists "org_orders_all" on public.service_orders;

-- Nova política: ADMIN/MANAGER veem tudo da org, WORKER só vê as dele
create policy "orders_admin_see_all" on public.service_orders
  for all using (
    organization_id = public.current_org_id()
    and public.current_user_role() in ('admin', 'manager')
  );

-- Funcionário só vê OS atribuídas a ele
create policy "orders_worker_see_own" on public.service_orders
  for select using (
    organization_id = public.current_org_id()
    and worker_id = auth.uid()
  );

-- Funcionário pode atualizar SUAS PRÓPRIAS OS (status, fotos, checklist)
create policy "orders_worker_update_own" on public.service_orders
  for update using (
    organization_id = public.current_org_id()
    and worker_id = auth.uid()
  );

-- ───────────────────────────────────────────────
-- 3. ATUALIZAR RLS DE CLIENTES - WORKER NÃO VÊ
-- ───────────────────────────────────────────────
drop policy if exists "org_clients_all" on public.clients;

create policy "clients_admin_manager" on public.clients
  for all using (
    organization_id = public.current_org_id()
    and public.current_user_role() in ('admin', 'manager')
  );

-- Worker pode VER clientes (pra mostrar na OS dele) mas não editar
create policy "clients_worker_read" on public.clients
  for select using (
    organization_id = public.current_org_id()
  );

-- ───────────────────────────────────────────────
-- 4. ATUALIZAR RLS DE FINANCEIRO - WORKER NÃO VÊ NADA
-- ───────────────────────────────────────────────
drop policy if exists "org_transactions_all" on public.transactions;

create policy "transactions_admin_manager" on public.transactions
  for all using (
    organization_id = public.current_org_id()
    and public.current_user_role() in ('admin', 'manager')
  );

-- ───────────────────────────────────────────────
-- 5. ATUALIZAR RLS DE PRODUTOS/ESTOQUE/ORÇAMENTOS
-- Worker pode ver mas não editar
-- ───────────────────────────────────────────────

drop policy if exists "org_products_all" on public.products;
create policy "products_admin_manager" on public.products
  for all using (
    organization_id = public.current_org_id()
    and public.current_user_role() in ('admin', 'manager')
  );
create policy "products_worker_read" on public.products
  for select using (organization_id = public.current_org_id());

drop policy if exists "org_inventory_all" on public.inventory_items;
create policy "inventory_admin_manager" on public.inventory_items
  for all using (
    organization_id = public.current_org_id()
    and public.current_user_role() in ('admin', 'manager')
  );
create policy "inventory_worker_read" on public.inventory_items
  for select using (organization_id = public.current_org_id());

drop policy if exists "org_quotes_all" on public.quotes;
create policy "quotes_admin_manager" on public.quotes
  for all using (
    organization_id = public.current_org_id()
    and public.current_user_role() in ('admin', 'manager')
  );

-- ═══════════════════════════════════════════════════════════════
-- PRONTO! Agora:
-- - Admin/Manager: vê tudo, edita tudo
-- - Worker (Funcionário): só vê as OS atribuídas a ele
--                         pode atualizar status e mandar foto
--                         vê produtos/estoque/clientes (só leitura)
--                         NÃO vê financeiro
-- ═══════════════════════════════════════════════════════════════

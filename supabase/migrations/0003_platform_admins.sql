-- ============================================================================
-- Concludo control plane: platform administrators
-- ----------------------------------------------------------------------------
-- Platform admins are Concludo staff who manage tenants (companies) and provision
-- tenant users. This is a SEPARATE concept from company_members (tenant access).
-- A tenant user must never gain control-plane access by being in this table.
--
-- RLS is enabled with NO policies, so only the service_role key (which bypasses
-- RLS, used server-side by the /admin console) can read or write it. The anon key
-- and tenant sessions can never see or modify it.
-- ============================================================================
create table if not exists platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

alter table platform_admins enable row level security;
-- (intentionally no policies — service_role only)

-- Concludo core schema — 0001_init.sql (Supabase / Postgres)
-- Aligns with PRD Section 4. Two principles are structural: provenance on every extracted fact
-- (§2.1, stored in jsonb), and immutable/versioned judgments (§2.2, enforced by trigger).

create extension if not exists "pgcrypto";

-- ===== Enums =====
create type contract_status  as enum ('draft','in_review','active','amended','terminated','blocked');
create type judgment_type    as enum ('contract_combination','distinctness','ssp_method','recognition_pattern',
                                      'variable_consideration','modification_type','commission_capitalization','amortization_period');
create type judgment_status  as enum ('proposed','under_review','approved','superseded');
create type confidence_tier  as enum ('observed_high','observed_low','benchmark_only');
create type ssp_method       as enum ('market_assessment','cost_plus_margin','residual');
create type recognition_type as enum ('point_in_time','over_time');
create type policy_source    as enum ('uploaded','system_generated','hybrid');
create type gap_type         as enum ('compliance','coverage');
create type gap_status       as enum ('open','in_review','resolved','dismissed');

-- ===== Tenancy (PRD §6: strict company_id isolation) =====
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry_segment text,
  created_at timestamptz not null default now()
);

create table company_members (
  company_id uuid not null references companies(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'member',
  primary key (company_id, user_id)
);

-- ===== Contracts =====
create table contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  customer text not null,
  status contract_status not null default 'draft',
  standard text not null default 'ASC_606',
  currency text not null default 'USD',
  entity text,
  effective_date date,
  term_start date,
  term_end date,
  term_months int,
  transaction_price numeric(14,2),
  -- Source document lives in the 'contract-sources' storage bucket (see 0002_storage.sql):
  source_file_path text,   -- e.g. '<company_id>/<contract_id>/original.pdf'
  source_file_name text,   -- e.g. '02_brightwell_logistics.pdf'
  source_origin text,      -- 'upload' | 'crm'
  -- Extracted facts, each carrying provenance {value, source:{clause,quote}, confidence} (PRD §2.1):
  extracted_facts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on contracts (company_id);
create index on contracts (status);

-- ===== Performance obligations =====
create table performance_obligations (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  description text not null,
  is_distinct boolean,               -- judgment output, never an assumed field
  ssp_method ssp_method,
  ssp_value numeric(14,2),
  ssp_confidence_tier confidence_tier,
  allocated_price numeric(14,2),     -- derived from relative-SSP allocation
  recognition_type recognition_type,
  recognition_method text,
  start_month text,                  -- 'YYYY-MM'
  end_month text,                    -- 'YYYY-MM' (null = duration not yet known)
  observable_pricing text,
  comparable_count int,
  created_at timestamptz not null default now()
);
create index on performance_obligations (contract_id);

-- ===== Judgments (immutable + versioned, PRD §2.2) =====
create table judgments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  performance_obligation_id uuid references performance_obligations(id) on delete cascade,
  judgment_type judgment_type not null,
  standard_ref text[] not null default '{}',
  contract_evidence jsonb not null default '[]'::jsonb,   -- [{clause, quote}]
  ai_proposed_conclusion jsonb not null,                  -- {value, reasoning_steps[], rejected_alternatives[]}
  structured jsonb,                                       -- machine-usable conclusion the deterministic layer reads
  confidence_tier confidence_tier,
  sensitivity_note text,
  human_decision jsonb,                                   -- {approved_by, decision, override_reason, timestamp}
  status judgment_status not null default 'proposed',
  supersedes  uuid references judgments(id),
  superseded_by uuid references judgments(id),
  created_at timestamptz not null default now()
);
create index on judgments (contract_id);
create index on judgments (performance_obligation_id);

-- Immutability: a reassessment creates a NEW row; only status / superseded_by / human_decision may change.
create or replace function judgments_block_core_updates() returns trigger as $$
begin
  if (new.contract_id, new.performance_obligation_id, new.judgment_type, new.standard_ref,
      new.contract_evidence, new.ai_proposed_conclusion, new.structured, new.confidence_tier,
      new.sensitivity_note, new.supersedes, new.created_at)
     is distinct from
     (old.contract_id, old.performance_obligation_id, old.judgment_type, old.standard_ref,
      old.contract_evidence, old.ai_proposed_conclusion, old.structured, old.confidence_tier,
      old.sensitivity_note, old.supersedes, old.created_at)
  then
    raise exception 'judgments are immutable — create a new version and set superseded_by instead';
  end if;
  return new;
end; $$ language plpgsql;
create trigger judgments_immutable before update on judgments
  for each row execute function judgments_block_core_updates();

-- ===== Policies & gap flags (PRD §5.2) =====
create table policies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  standard text not null default 'ASC_606',
  version int not null default 1,
  source policy_source not null,
  effective_date date,
  created_at timestamptz not null default now()
);
create index on policies (company_id);

create table policy_provisions (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references policies(id) on delete cascade,
  determination_type text not null,
  company_position text not null,
  standard_citation text
);
create index on policy_provisions (policy_id);

create table gap_flags (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references policies(id) on delete cascade,
  type gap_type not null,
  severity text,                     -- 'critical' | 'warning' | 'info'
  description text not null,
  standard_citation text,
  related_contract_id uuid references contracts(id) on delete set null,
  status gap_status not null default 'open',
  created_at timestamptz not null default now()
);
create index on gap_flags (policy_id);

-- ===== updated_at maintenance =====
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
create trigger contracts_updated_at before update on contracts
  for each row execute function set_updated_at();

-- ===== Row-level security (tenant isolation) =====
-- The engine backend connects with the SERVICE ROLE key, which bypasses RLS. These policies protect a
-- future browser frontend that connects with the ANON key + a logged-in user.
alter table companies                enable row level security;
alter table company_members          enable row level security;
alter table contracts                enable row level security;
alter table performance_obligations  enable row level security;
alter table judgments                enable row level security;
alter table policies                 enable row level security;
alter table policy_provisions        enable row level security;
alter table gap_flags                enable row level security;

create or replace function is_member(cid uuid) returns boolean as $$
  select exists (select 1 from company_members m where m.company_id = cid and m.user_id = auth.uid());
$$ language sql security definer stable;

create policy company_read on companies       for select using (is_member(id));
create policy members_self  on company_members for select using (user_id = auth.uid());

create policy contracts_rw on contracts
  using (is_member(company_id)) with check (is_member(company_id));
create policy pos_rw on performance_obligations
  using (is_member((select c.company_id from contracts c where c.id = contract_id)))
  with check (is_member((select c.company_id from contracts c where c.id = contract_id)));
create policy judgments_rw on judgments
  using (is_member((select c.company_id from contracts c where c.id = contract_id)))
  with check (is_member((select c.company_id from contracts c where c.id = contract_id)));
create policy policies_rw on policies
  using (is_member(company_id)) with check (is_member(company_id));
create policy provisions_rw on policy_provisions
  using (is_member((select p.company_id from policies p where p.id = policy_id)))
  with check (is_member((select p.company_id from policies p where p.id = policy_id)));
create policy gaps_rw on gap_flags
  using (is_member((select p.company_id from policies p where p.id = policy_id)))
  with check (is_member((select p.company_id from policies p where p.id = policy_id)));

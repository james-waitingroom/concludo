-- Simplify contract status to the working set the UI uses: Active / In Review / Denied.
-- 'denied' is added to the enum; legacy values are collapsed into the three.

-- 1. Add the new value (safe to re-run).
alter type contract_status add value if not exists 'denied';

-- (adding an enum value must be committed before it can be USED below; run this file as-is —
--  Supabase's SQL editor auto-commits statements, so the update in step 2 will see 'denied'.)

-- 2. Collapse legacy rows into the three-value world.
update contracts set status = 'in_review' where status = 'draft';
update contracts set status = 'active'    where status = 'amended';
update contracts set status = 'denied'    where status in ('terminated','blocked');

-- 3. New contracts start life "In Review".
alter table contracts alter column status set default 'in_review';

-- Concludo storage — 0002_storage.sql
-- A PRIVATE bucket for source contract PDFs (uploaded or CRM-integrated). Files are keyed by
-- '<company_id>/<contract_id>/<filename>.pdf' so RLS can scope access to company members.
-- The engine backend reads/writes with the service role (bypasses RLS); the browser frontend uses
-- signed URLs minted server-side, or these member policies when the user is authenticated.

insert into storage.buckets (id, name, public)
values ('contract-sources', 'contract-sources', false)
on conflict (id) do nothing;

-- Allow a company member to read/write objects whose first path segment is their company id.
create policy "contract sources: member read" on storage.objects
  for select using (
    bucket_id = 'contract-sources'
    and is_member( (storage.foldername(name))[1]::uuid )
  );

create policy "contract sources: member write" on storage.objects
  for insert with check (
    bucket_id = 'contract-sources'
    and is_member( (storage.foldername(name))[1]::uuid )
  );

create policy "contract sources: member update" on storage.objects
  for update using (
    bucket_id = 'contract-sources'
    and is_member( (storage.foldername(name))[1]::uuid )
  );

create policy "contract sources: member delete" on storage.objects
  for delete using (
    bucket_id = 'contract-sources'
    and is_member( (storage.foldername(name))[1]::uuid )
  );

-- Company branding: a logo set by Concludo admins, shown in the tenant sidebar.
-- Stored as a small data URI (base64) for simple, signed-URL-free display.
alter table companies add column if not exists logo text;

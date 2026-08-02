-- BetterCallQ — Task 8C.2
-- Risoluzione dell'identità applicativa tramite profilo e membership.
-- La funzione non riceve user_id come parametro: usa esclusivamente auth.uid()
-- per evitare accessi orizzontali ad altri utenti.

create index salon_memberships_user_status_idx
  on public.salon_memberships (user_id, status, created_at);

create or replace function public.current_app_identity()
returns table (
  user_id uuid,
  display_name text,
  platform_role public.platform_role,
  salon_id uuid,
  membership_role public.salon_membership_role
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profiles.user_id,
    profiles.display_name,
    profiles.platform_role,
    null::uuid as salon_id,
    null::public.salon_membership_role as membership_role
  from public.profiles as profiles
  where profiles.user_id = (select auth.uid())
    and profiles.platform_role = 'admin'

  union all

  select
    profiles.user_id,
    profiles.display_name,
    profiles.platform_role,
    memberships.salon_id,
    memberships.role as membership_role
  from public.profiles as profiles
  join public.salon_memberships as memberships
    on memberships.user_id = profiles.user_id
   and memberships.status = 'active'
  join public.salons as salons
    on salons.id = memberships.salon_id
   and salons.status in ('trial', 'active')
  where profiles.user_id = (select auth.uid())
    and profiles.platform_role = 'standard'
  order by salon_id nulls first;
$$;

revoke all
  on function public.current_app_identity()
  from public;

revoke all
  on function public.current_app_identity()
  from anon;

grant execute
  on function public.current_app_identity()
  to authenticated;

comment on function public.current_app_identity() is
  'Restituisce soltanto identità e membership dell utente autenticato.';

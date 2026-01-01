-- RPC function to create workspace + auto-add creator as owner (atomic)
create or replace function public.create_workspace_with_member(p_name text)
returns public.workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace public.workspaces;
begin
  -- Validate input
  if p_name is null or trim(p_name) = '' then
    raise exception 'Workspace name cannot be empty';
  end if;

  -- Create workspace
  insert into public.workspaces (name, owner_id)
  values (trim(p_name), auth.uid())
  returning * into v_workspace;

  -- Add creator as owner member (bypasses RLS because security definer)
  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace.id, auth.uid(), 'owner');

  return v_workspace;
end;
$$;

-- Grant execute permission to authenticated users only
revoke all on function public.create_workspace_with_member(text) from public;
grant execute on function public.create_workspace_with_member(text) to authenticated;

-- Remove the trigger since we're using RPC instead
drop trigger if exists on_workspace_created on public.workspaces;
drop function if exists public.handle_new_workspace();

-- Update workspace insert policy to prevent direct inserts (force RPC usage)
drop policy if exists "Users can create workspaces" on public.workspaces;
create policy "No direct workspace inserts"
  on public.workspaces for insert
  to authenticated
  with check (false);

-- Create workspaces table
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create workspace_members table for access control
create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz default now() not null,
  unique(workspace_id, user_id)
);

-- Enable RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

-- Workspaces policies
create policy "Users can view workspaces they are members of"
  on public.workspaces for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspaces.id
      and workspace_members.user_id = auth.uid()
    )
  );

create policy "Users can create workspaces"
  on public.workspaces for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their workspaces"
  on public.workspaces for update
  using (owner_id = auth.uid());

create policy "Owners can delete their workspaces"
  on public.workspaces for delete
  using (owner_id = auth.uid());

-- Workspace members policies
create policy "Users can view their own workspace memberships"
  on public.workspace_members for select
  using (user_id = auth.uid());

create policy "System can create workspace members"
  on public.workspace_members for insert
  with check (true);

create policy "Owners can update workspace members"
  on public.workspace_members for update
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_members.workspace_id
      and w.owner_id = auth.uid()
    )
  );

create policy "Owners can remove workspace members"
  on public.workspace_members for delete
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_members.workspace_id
      and w.owner_id = auth.uid()
    )
  );

-- Function to automatically add creator as owner (bypasses RLS)
create or replace function public.handle_new_workspace()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

-- Grant necessary permissions to the function
grant execute on function public.handle_new_workspace() to authenticated;

-- Trigger to auto-add owner as member
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute procedure public.handle_new_workspace();

-- Indexes for performance
create index workspace_members_user_id_idx on public.workspace_members(user_id);
create index workspace_members_workspace_id_idx on public.workspace_members(workspace_id);

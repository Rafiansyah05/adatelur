-- Allow newly signed-up users to insert their own profile
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'users can insert own profile'
  ) then
    execute 'create policy "users can insert own profile" on profiles for insert with check (auth.uid() = id)';
  end if;
end $$;

-- Allow authenticated users to insert their own peternak_details
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'peternak_details' and policyname = 'peternak can insert own details'
  ) then
    execute 'create policy "peternak can insert own details" on peternak_details for insert with check (auth.uid() = profile_id)';
  end if;
end $$;

-- Allow peternak to insert verification photos for their own record
alter table peternak_verification_photos enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'peternak_verification_photos' and policyname = 'peternak can insert verification photos'
  ) then
    execute $p$
      create policy "peternak can insert verification photos"
        on peternak_verification_photos for insert
        with check (
          peternak_id in (
            select id from peternak_details where profile_id = auth.uid()
          )
        )
    $p$;
  end if;
end $$;

-- Allow peternak to insert their own vehicles
alter table vehicles enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'vehicles' and policyname = 'peternak can insert vehicles'
  ) then
    execute $p$
      create policy "peternak can insert vehicles"
        on vehicles for insert
        with check (
          peternak_id in (
            select id from peternak_details where profile_id = auth.uid()
          )
        )
    $p$;
  end if;
end $$;

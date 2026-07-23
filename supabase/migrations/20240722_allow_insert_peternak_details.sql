drop policy if exists "allow_insert_authenticated"
on public.peternak_details;

create policy "allow_insert_authenticated"
on public.peternak_details
for insert
with check (
    auth.uid() is not null
);
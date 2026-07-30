alter table peternak_details 
add column if not exists farm_name text default 'Peternak Ada Telur';

update peternak_details 
set farm_name = 'Peternak Ada Telur' 
where farm_name is null or farm_name = '';

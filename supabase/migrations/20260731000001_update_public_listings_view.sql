drop view if exists public_listings cascade;

create view public_listings as
select
  l.id as listing_id,
  l.peternak_id,
  pd.farm_latitude,
  pd.farm_longitude,
  l.price_per_rak,
  l.is_available,
  ps.final_score,
  coalesce(nullif(pd.farm_name, ''), p.full_name, 'Peternak Ada Telur') as peternak_name,
  p.avatar_url
from listings l
join peternak_details pd on pd.id = l.peternak_id
join profiles p on p.id = pd.profile_id
left join peternak_scores ps on ps.peternak_id = l.peternak_id
where l.is_available = true
  and coalesce(ps.is_suspended, false) = false;

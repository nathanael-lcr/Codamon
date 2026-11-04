create table if not exists public.card_exchange_offer (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.player (id) on delete cascade,
  offer_card_id uuid not null references public.cards (id),
  offer_quantity integer not null check (offer_quantity > 0),
  want_card_id uuid not null references public.cards (id),
  want_quantity integer not null check (want_quantity > 0),
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint card_exchange_offer_distinct_cards check (offer_card_id <> want_card_id)
);

create index if not exists card_exchange_offer_pending_created_idx
  on public.card_exchange_offer (created_at desc)
  where status = 'pending';

alter table public.card_exchange_offer enable row level security;
revoke all on public.card_exchange_offer from anon, authenticated;

create or replace function public.list_card_exchange_offers()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_player_id uuid := auth.uid();
  v_offers jsonb;
begin
  if v_player_id is null then
    raise exception 'Connecte-toi pour consulter les échanges.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'creatorId', o.creator_id,
        'creatorName', coalesce(nullif(p.display_name, ''), p.username, 'Joueur'),
        'offerCard', to_jsonb(offered_card),
        'offerQuantity', o.offer_quantity,
        'wantCard', to_jsonb(wanted_card),
        'wantQuantity', o.want_quantity,
        'createdAt', o.created_at
      )
      order by o.created_at desc
    ),
    '[]'::jsonb
  )
  into v_offers
  from public.card_exchange_offer o
  join public.player p on p.id = o.creator_id
  join public.cards offered_card on offered_card.id = o.offer_card_id
  join public.cards wanted_card on wanted_card.id = o.want_card_id
  where o.status = 'pending';

  return jsonb_build_object('offers', v_offers);
end;
$$;

create or replace function public.create_card_exchange_offer(
  p_offer_card_id uuid,
  p_offer_quantity integer,
  p_want_card_id uuid,
  p_want_quantity integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_player_id uuid := auth.uid();
  v_owned_quantity integer;
  v_offer public.card_exchange_offer%rowtype;
begin
  if v_player_id is null then
    raise exception 'Connecte-toi pour proposer un échange.';
  end if;
  if p_offer_card_id is null or p_want_card_id is null
    or p_offer_card_id = p_want_card_id then
    raise exception 'Choisis deux cartes différentes.';
  end if;
  if p_offer_quantity is null or p_offer_quantity < 1
    or p_want_quantity is null or p_want_quantity < 1 then
    raise exception 'Les quantités doivent être supérieures à zéro.';
  end if;
  if not exists (
    select 1 from public.cards c
    where c.id = p_want_card_id and c.is_active
  ) then
    raise exception 'La carte demandée n’est plus disponible.';
  end if;

  select pc.quantity
  into v_owned_quantity
  from public.player_card pc
  where pc.player_id = v_player_id
    and pc.card_id = p_offer_card_id
  for update;

  if not found or v_owned_quantity < p_offer_quantity then
    raise exception 'Tu ne possèdes pas assez d’exemplaires de cette carte.';
  end if;

  insert into public.card_exchange_offer (
    creator_id, offer_card_id, offer_quantity, want_card_id, want_quantity
  )
  values (
    v_player_id, p_offer_card_id, p_offer_quantity, p_want_card_id, p_want_quantity
  )
  returning * into v_offer;

  return to_jsonb(v_offer);
end;
$$;

create or replace function public.cancel_card_exchange_offer(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_player_id uuid := auth.uid();
  v_offer public.card_exchange_offer%rowtype;
begin
  if v_player_id is null then
    raise exception 'Connecte-toi pour annuler un échange.';
  end if;

  select *
  into v_offer
  from public.card_exchange_offer
  where id = p_offer_id
  for update;

  if not found or v_offer.creator_id <> v_player_id then
    raise exception 'Cette offre ne t’appartient pas.';
  end if;
  if v_offer.status <> 'pending' then
    raise exception 'Cette offre n’est plus disponible.';
  end if;

  update public.card_exchange_offer
  set status = 'cancelled'
  where id = p_offer_id
  returning * into v_offer;

  return to_jsonb(v_offer);
end;
$$;

create or replace function public.accept_card_exchange_offer(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_player_id uuid := auth.uid();
  v_offer public.card_exchange_offer%rowtype;
  v_creator_quantity integer;
  v_acceptor_quantity integer;
begin
  if v_player_id is null then
    raise exception 'Connecte-toi pour accepter un échange.';
  end if;

  select *
  into v_offer
  from public.card_exchange_offer
  where id = p_offer_id
  for update;

  if not found or v_offer.status <> 'pending' then
    raise exception 'Cette offre n’est plus disponible.';
  end if;
  if v_offer.creator_id = v_player_id then
    raise exception 'Tu ne peux pas accepter ta propre offre.';
  end if;

  perform 1
  from public.player_card pc
  where (pc.player_id = v_offer.creator_id and pc.card_id = v_offer.offer_card_id)
     or (pc.player_id = v_player_id and pc.card_id = v_offer.want_card_id)
  order by pc.player_id, pc.card_id
  for update;

  select pc.quantity into v_creator_quantity
  from public.player_card pc
  where pc.player_id = v_offer.creator_id
    and pc.card_id = v_offer.offer_card_id;

  select pc.quantity into v_acceptor_quantity
  from public.player_card pc
  where pc.player_id = v_player_id
    and pc.card_id = v_offer.want_card_id;

  if coalesce(v_creator_quantity, 0) < v_offer.offer_quantity then
    raise exception 'Le créateur ne possède plus assez d’exemplaires pour cet échange.';
  end if;
  if coalesce(v_acceptor_quantity, 0) < v_offer.want_quantity then
    raise exception 'Tu ne possèdes pas assez d’exemplaires de la carte demandée.';
  end if;

  update public.player_card
  set quantity = quantity - v_offer.offer_quantity
  where player_id = v_offer.creator_id
    and card_id = v_offer.offer_card_id;

  delete from public.player_card
  where player_id = v_offer.creator_id
    and card_id = v_offer.offer_card_id
    and quantity = 0;

  update public.player_card
  set quantity = quantity - v_offer.want_quantity
  where player_id = v_player_id
    and card_id = v_offer.want_card_id;

  delete from public.player_card
  where player_id = v_player_id
    and card_id = v_offer.want_card_id
    and quantity = 0;

  insert into public.player_card (player_id, card_id, quantity, acquired_at)
  values (v_player_id, v_offer.offer_card_id, v_offer.offer_quantity, clock_timestamp())
  on conflict (player_id, card_id)
  do update set
    quantity = public.player_card.quantity + excluded.quantity,
    acquired_at = excluded.acquired_at;

  insert into public.player_card (player_id, card_id, quantity, acquired_at)
  values (v_offer.creator_id, v_offer.want_card_id, v_offer.want_quantity, clock_timestamp())
  on conflict (player_id, card_id)
  do update set
    quantity = public.player_card.quantity + excluded.quantity,
    acquired_at = excluded.acquired_at;

  update public.card_exchange_offer
  set status = 'completed',
      completed_at = clock_timestamp()
  where id = p_offer_id
  returning * into v_offer;

  return to_jsonb(v_offer);
end;
$$;

revoke all on function public.list_card_exchange_offers() from public, anon;
revoke all on function public.create_card_exchange_offer(uuid, integer, uuid, integer) from public, anon;
revoke all on function public.cancel_card_exchange_offer(uuid) from public, anon;
revoke all on function public.accept_card_exchange_offer(uuid) from public, anon;

grant execute on function public.list_card_exchange_offers() to authenticated;
grant execute on function public.create_card_exchange_offer(uuid, integer, uuid, integer) to authenticated;
grant execute on function public.cancel_card_exchange_offer(uuid) to authenticated;
grant execute on function public.accept_card_exchange_offer(uuid) to authenticated;

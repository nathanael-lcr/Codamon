create table if not exists public.player_pack_energy (
  player_id uuid primary key references public.player (id) on delete cascade,
  available_packs smallint not null default 5
    check (available_packs between 0 and 5),
  next_refill_at timestamptz
);

create unique index if not exists player_card_player_id_card_id_key
  on public.player_card (player_id, card_id);

alter table public.player_pack_energy enable row level security;

revoke all on public.player_pack_energy from anon, authenticated;

create or replace function public.pack_energy(p_consume boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_player_id uuid := auth.uid();
  v_available smallint;
  v_next_refill timestamptz;
  v_now timestamptz := clock_timestamp();
  v_refills integer;
  v_added integer;
  v_total_weight integer;
  v_roll double precision;
  v_rarity text;
  v_index integer;
  v_card public.cards%rowtype;
  v_selected_ids uuid[] := '{}';
  v_cards jsonb := '[]'::jsonb;
begin
  if v_player_id is null then
    raise exception 'Connecte-toi pour ouvrir un paquet.';
  end if;

  insert into public.player_pack_energy (player_id)
  values (v_player_id)
  on conflict (player_id) do nothing;

  select available_packs, next_refill_at
  into v_available, v_next_refill
  from public.player_pack_energy
  where player_id = v_player_id
  for update;

  if v_available < 5 and v_next_refill is not null and v_now >= v_next_refill then
    v_refills := floor(extract(epoch from (v_now - v_next_refill)) / 14400)::integer + 1;
    v_added := least(5 - v_available, v_refills);
    v_available := v_available + v_added;

    if v_available = 5 then
      v_next_refill := null;
    else
      v_next_refill := v_next_refill + (v_added * interval '4 hours');
    end if;
  end if;

  if p_consume then
    if v_available = 0 then
      raise exception 'Aucun paquet disponible. Prochaine recharge : %', v_next_refill;
    end if;

    for v_index in 1..5 loop
      select coalesce(sum(rarity_weight), 0)
      into v_total_weight
      from (
        select normalized_rarity, max(rarity_weight) as rarity_weight
        from (
          select
            case
              when c.rarity in ('common', 'rare', 'epic', 'legendary', 'slegendary')
                then c.rarity
              else 'common'
            end as normalized_rarity,
            case
              when c.rarity = 'common' then 60
              when c.rarity = 'rare' then 25
              when c.rarity = 'epic' then 10
              when c.rarity = 'legendary' then 4
              when c.rarity = 'slegendary' then 1
              else 60
            end as rarity_weight
          from public.cards c
          where c.is_active
            and not (c.id = any(v_selected_ids))
        ) rarity_rows
        group by normalized_rarity
      ) available_rarities;

      if v_total_weight = 0 then
        raise exception 'Le catalogue ne contient pas assez de cartes actives.';
      end if;

      v_roll := random() * v_total_weight;

      select normalized_rarity
      into v_rarity
      from (
        select normalized_rarity, cumulative_weight
        from (
          select
            normalized_rarity,
            sum(rarity_weight) over (
              order by case normalized_rarity
                when 'common' then 1
                when 'rare' then 2
                when 'epic' then 3
                when 'legendary' then 4
                else 5
              end
            ) as cumulative_weight
          from (
            select normalized_rarity, max(rarity_weight) as rarity_weight
            from (
              select
                case
                  when c.rarity in ('common', 'rare', 'epic', 'legendary', 'slegendary')
                    then c.rarity
                  else 'common'
                end as normalized_rarity,
                case
                  when c.rarity = 'common' then 60
                  when c.rarity = 'rare' then 25
                  when c.rarity = 'epic' then 10
                  when c.rarity = 'legendary' then 4
                  when c.rarity = 'slegendary' then 1
                  else 60
                end as rarity_weight
              from public.cards c
              where c.is_active
                and not (c.id = any(v_selected_ids))
            ) rarity_rows
            group by normalized_rarity
          ) rarity_rows
        ) weighted_rarities
        where v_roll < cumulative_weight
        order by cumulative_weight
        limit 1
      ) selected_rarity;

      if v_rarity is null then
        raise exception 'Impossible de sélectionner une rareté pour le paquet.';
      end if;

      select c.*
      into v_card
      from public.cards c
      where c.is_active
        and not (c.id = any(v_selected_ids))
        and (
          case
            when c.rarity in ('common', 'rare', 'epic', 'legendary', 'slegendary')
              then c.rarity
            else 'common'
          end
        ) = v_rarity
      order by random()
      limit 1;

      if not found then
        raise exception 'Impossible de sélectionner une carte pour le paquet.';
      end if;

      v_selected_ids := array_append(v_selected_ids, v_card.id);
    end loop;

    select jsonb_agg(
      to_jsonb(c)
      order by case c.rarity
        when 'common' then 1
        when 'rare' then 2
        when 'epic' then 3
        when 'legendary' then 4
        else 5
      end
    )
    into v_cards
    from public.cards c
    where c.id = any(v_selected_ids);

    if v_available = 5 then
      v_next_refill := v_now + interval '4 hours';
    end if;

    v_available := v_available - 1;

    insert into public.player_card (player_id, card_id, quantity, acquired_at)
    select v_player_id, selected.card_id, 1, v_now
    from unnest(v_selected_ids) as selected(card_id)
    on conflict (player_id, card_id)
    do update set
      quantity = public.player_card.quantity + excluded.quantity,
      acquired_at = excluded.acquired_at;
  end if;

  update public.player_pack_energy
  set available_packs = v_available,
      next_refill_at = v_next_refill
  where player_id = v_player_id;

  return jsonb_build_object(
    'availablePacks', v_available,
    'nextRefillAt', v_next_refill,
    'cards', case when p_consume then v_cards else null end
  );
end;
$$;

revoke all on function public.pack_energy(boolean) from public, anon;
grant execute on function public.pack_energy(boolean) to authenticated;

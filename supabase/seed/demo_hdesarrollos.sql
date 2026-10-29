-- =============================================================================
-- Demo data for manual testing: 3 clients, 4 assets, 5 work orders,
-- all inside the organization whose name starts with "HDESARROLLOS".
--
-- Run in Supabase → SQL Editor. Running it twice duplicates the data.
-- organization_id is set explicitly because the SQL editor has no auth.uid(),
-- so the my_org_id() default would be null here.
-- =============================================================================

do $$
declare
  v_org uuid;
  c1 uuid; c2 uuid; c3 uuid;
  a1 uuid; a2 uuid; a3 uuid; a4 uuid;
begin
  select id into v_org from public.organizations where name like 'HDESARROLLOS%' limit 1;
  if v_org is null then
    raise exception 'No se encontró la empresa HDESARROLLOS';
  end if;

  -- Clients ------------------------------------------------------------------
  insert into public.clients (organization_id, company_name, nit, address, contact_email, contact_phone)
  values (v_org, 'Clínica San Rafael', '900123456-1', 'Cra 15 #45-20', 'mantenimiento@sanrafael.co', '3001234567')
  returning id into c1;

  insert into public.clients (organization_id, company_name, nit, address, contact_email, contact_phone)
  values (v_org, 'Hotel Bahía Azul', '900654321-7', 'Av. del Mar #10-50', 'operaciones@bahiaazul.co', '3017654321')
  returning id into c2;

  insert into public.clients (organization_id, company_name, nit, address, contact_email, contact_phone)
  values (v_org, 'Centro Comercial Plaza Norte', '901112233-4', 'Calle 80 #20-15', 'admin@plazanorte.co', '3024445566')
  returning id into c3;

  -- Assets (qr_code is a unique tag printed on the equipment) ----------------
  insert into public.assets (organization_id, client_id, qr_code, name, type, brand, model, location, installation_date, status)
  values (v_org, c1, 'FX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
          'Aire acondicionado Quirófano 2', 'Climatización', 'Carrier', '42QHC', 'Piso 2 - Quirófano 2', '2022-03-10', 'activo')
  returning id into a1;

  insert into public.assets (organization_id, client_id, qr_code, name, type, brand, model, location, installation_date, status)
  values (v_org, c1, 'FX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
          'Planta eléctrica de emergencia', 'Generación eléctrica', 'Cummins', 'C150D5', 'Sótano', '2019-08-22', 'en_mantenimiento')
  returning id into a2;

  insert into public.assets (organization_id, client_id, qr_code, name, type, brand, model, location, installation_date, status)
  values (v_org, c2, 'FX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
          'Bomba de agua piscina', 'Hidráulico', 'Pedrollo', 'CPm 680', 'Cuarto de máquinas', '2021-01-15', 'activo')
  returning id into a3;

  insert into public.assets (organization_id, client_id, qr_code, name, type, brand, model, location, installation_date, status)
  values (v_org, c3, 'FX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
          'Tablero eléctrico principal', 'Eléctrico', 'Schneider', 'Prisma P', 'Subestación', '2020-11-03', 'activo')
  returning id into a4;

  -- Work orders (order_number is filled by the set_order_number trigger) -----
  insert into public.work_orders (organization_id, client_id, asset_id, type, priority, status, scheduled_date, description)
  values
    (v_org, c1, a1, 'correctivo', 'urgente', 'pendiente', current_date,
     'El aire del quirófano 2 no enfría. Revisar compresor y carga de gas.'),
    (v_org, c1, a2, 'preventivo', 'alta', 'en_proceso', current_date,
     'Mantenimiento preventivo trimestral: cambio de aceite y filtros.'),
    (v_org, c2, a3, 'correctivo', 'media', 'pendiente', current_date + 1,
     'La bomba hace ruido y pierde presión.'),
    (v_org, c2, null, 'instalacion', 'baja', 'pendiente', current_date + 5,
     'Instalación de 3 minisplits en habitaciones del piso 4.');

  insert into public.work_orders (organization_id, client_id, asset_id, type, priority, status, scheduled_date, completed_date, description)
  values (v_org, c3, a4, 'preventivo', 'media', 'completada', current_date - 3, current_date - 2,
          'Termografía y reapriete de conexiones del tablero principal.');
end $$;

-- Check:
-- select order_number, status, priority from public.work_orders order by created_at;

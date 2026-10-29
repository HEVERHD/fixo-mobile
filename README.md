# Fixo

Plataforma de gestión integral para **contratistas de servicios electromecánicos, mantenimiento y obras**. Una empresa contratista administra sus clientes, sus equipos (aires acondicionados, tableros eléctricos, bombas…) y su equipo técnico; los técnicos ejecutan las órdenes en campo; y los clientes consultan el estado e historial de sus equipos y piden servicios.

Es un **monorepo** con dos apps que comparten el mismo proyecto de Supabase:

| App | Carpeta | Tecnología | Para qué |
|---|---|---|---|
| Móvil | `apps/mobile` | Expo (SDK 58) + Expo Router + NativeWind | Administradores y técnicos en campo (Android e iOS) |
| Web | `apps/web` | Next.js 16 + Tailwind 4 + shadcn/ui | Portal del cliente y panel web del administrador |

El esquema de la base de datos vive en `supabase/migrations/` (raíz) y es el mismo para las dos.

---

## Roles

Al iniciar sesión, la app abre el área que corresponde al rol del usuario dentro de su empresa.

| Rol | Qué hace |
|---|---|
| **Administrador** | Control total de su empresa: clientes, equipos, obras, órdenes de trabajo, técnicos e invitaciones. Quien registra la empresa es su primer administrador. |
| **Operario / Técnico** | Ve sus órdenes asignadas, las inicia y las cierra con un reporte (trabajo realizado, observaciones, pendientes). Escanea el QR de los equipos. |
| **Cliente** | Ve sus equipos con su ficha e historial de mantenimientos. |
| **Super admin** (plataforma) | Dueños de Fixo: ven todas las empresas, métricas de la plataforma y pueden eliminar una empresa. No es un rol de empresa, es una tabla aparte (`platform_admins`). |

**Multiempresa:** cada empresa (`organizations`) solo ve sus propios datos. Lo garantiza la base de datos con RLS, no la app.

**Tipo de negocio:** cada empresa elige `mantenimiento`, `construccion` o `ambos`. Eso decide qué pestañas se muestran (Equipos, Obras o ambas); el modelo de datos es el mismo.

---

## Estado de las funcionalidades

### ✅ Hecho

- **Registro de empresa** con su administrador, logo y tipo de negocio.
- **Clientes**: crear y listar, con estado de acceso al portal.
- **Equipos**: crear y listar; cada uno recibe un código único `FX-XXXXXXXXXX` generado por la base de datos.
- **Ficha del equipo**: datos técnicos, pendientes de la última visita, órdenes abiertas e historial de mantenimientos.
- **QR**: etiquetas imprimibles (6 × 4 cm) y escáner con la cámara. Ver [Códigos QR](#códigos-qr).
- **Obras (proyectos)**: avance, presupuesto y estado; agrupan órdenes de trabajo.
- **Órdenes de trabajo**: crear, asignar técnico, iniciar y cerrar con reporte.
- **Invitaciones** de técnicos y usuarios cliente, compartibles por WhatsApp. Ver [Invitaciones](#invitaciones).
- **Panel de plataforma** para super admins.
- **Solicitudes de servicio**: el cliente las envía desde el portal web (`/cliente/solicitar`); el admin las responde en la app o en la web (`/admin/solicitudes`). Aceptar crea la orden de trabajo, rechazar guarda un motivo para el cliente. Ver [Solicitudes de servicio](#solicitudes-de-servicio).
- **Web (`apps/web`) con el diseño de la app**: landing pública, login, panel del admin (órdenes, equipos, clientes, técnicos, invitaciones, solicitudes), vista del técnico y portal del cliente.

### 🚧 Próximo

- Marca de agua (fecha, hora y GPS) en las fotos de evidencia (las fotos ya se suben con el reporte en la web y la app).
- Fichaje de entrada y salida con geolocalización en el punto de trabajo.
- Checklists de inspección (RETIE / NTC 2050) y firma digital del cliente.
- Paquete compartido `packages/shared` con tipos y etiquetas comunes (estados, prioridades, solicitudes) para no duplicarlos entre las dos apps.
- Poner la web al día con el esquema multiempresa (ver [Pendientes de la web](#pendientes-de-la-web)).
- Animaciones Lottie (la base ya está en `components/Animation.tsx`; faltan los archivos en `assets/lottie/`).

### 📋 Después

- Cotizaciones y cuentas de cobro en la app móvil *(en la web ya están: cotizador por ítems con AIU e IVA, PDF, aprobación del cliente desde su portal y cuentas de cobro con estados)*.
- Administrar el catálogo APU de cada empresa (hoy se usa si existe, pero no hay pantalla para llenarlo) y recordatorios de cobro.
- Proveedores y facturas de compra vinculadas a obras.
- Control de asistencia, cálculo de jornadas y volantes de pago.
- Flujo de caja y notificaciones por WhatsApp.

---

## Puesta en marcha

### Requisitos

- Node.js LTS y **yarn** (el proyecto usa `yarn.lock`).
- Un proyecto de Supabase.
- Un teléfono con **Expo Go**, o un emulador de Android Studio.

### 1. Variables de entorno

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
```

La web usa su propio `apps/web/.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, del mismo proyecto de Supabase.

Completa los valores en Supabase Dashboard → Project Settings → API. **`.env.local` nunca se commitea.** Solo va la `anon key`, que es pública por diseño: la seguridad la da RLS. La `service_role` key nunca va en la app.

### 2. Base de datos

Las migraciones se aplican **a mano, en orden**, desde Supabase → SQL Editor. Cada una corre en una sola transacción: si falla, no se aplica nada.

| Migración | Qué hace |
|---|---|
| `20261028120000_multi_tenant.sql` | Empresas, `organization_id` en todas las tablas y políticas RLS por empresa y rol |
| `20261028130000_super_admin_and_logos.sql` | Super admins, métricas de plataforma y bucket de logos |
| `20261028140000_business_type_and_projects.sql` | Tipo de negocio y obras |
| `20261028150000_platform_delete_organization.sql` | Eliminar empresas con auditoría |
| `20261028160000_work_reports.sql` | Reportes para órdenes sin equipo |
| `20261028170000_invitations.sql` | Invitaciones y código QR por defecto en equipos |
| `20261029100000_service_requests.sql` | Solicitudes de servicio de los clientes (portal web) y `accept_service_request()` para convertirlas en órdenes |
| `20261029120000_work_photos.sql` | Bucket privado `work-photos` para las fotos de evidencia del reporte: sube el técnico asignado mientras la orden está en proceso; las ven la empresa y el cliente de esa orden |

> ⚠️ **Falta la migración base.** La primera migración modifica tablas (`profiles`, `clients`, `operators`, `assets`, `work_orders`, `maintenance_records`, `apu_catalog`, `quotes`, `quote_items`, `invoices`) que se crearon directamente en Supabase. Hoy no se puede recrear la base de datos desde el repo. Pendiente: `supabase db dump --schema public` y guardarlo como `20261028000000_baseline.sql`.

**Datos de prueba** (opcionales), en `supabase/seed/`:

- `demo_hdesarrollos.sql`: 3 clientes, 4 equipos y 5 órdenes en la empresa `HDESARROLLOS`.
- `attach_test_users.sql`: vincula dos usuarios ya creados como operario y cliente. Hoy es más fácil usar las invitaciones desde la app.

### 3. Configuración de Supabase Auth

- **Authentication → Providers → Email → "Confirm email": activado.** Es obligatorio: las invitaciones se reclaman solo con el correo confirmado.
- **Authentication → URL Configuration → Redirect URLs**: agregar `fixo://**` y, en desarrollo, la URL `exp://…` que muestra Expo.
- El correo por defecto de Supabase **solo envía a miembros del equipo del proyecto** y a pocos correos por hora. Antes de tener usuarios reales hay que configurar un SMTP propio (Resend, SendGrid…).

### 4. Correr las apps

Desde la raíz del repo:

```bash
yarn install          # instala las dos apps (un solo yarn.lock en la raíz)
yarn mobile           # app móvil: luego "a" para Android o escanear el QR con Expo Go
yarn web              # web en http://localhost:3000
```

---

## Comandos

Es un monorepo con workspaces de Yarn. Usa siempre `yarn`: **`npx` falla dentro del monorepo** porque resuelve mal los ejecutables locales.

Desde la raíz:

```bash
yarn lint               # lint de las dos apps
yarn typecheck          # typecheck de las dos apps
```

Dentro de `apps/mobile`:

```bash
yarn expo start         # servidor de desarrollo
yarn expo start -c      # igual, limpiando la caché (después de instalar dependencias)
yarn expo-doctor        # diagnóstico de dependencias y configuración
yarn expo install <pkg> # SIEMPRE así para agregar paquetes (versiones compatibles con el SDK)
```

Lint y typecheck deben pasar antes de dar una tarea por terminada.

---

## Estructura

```
apps/mobile/            App móvil (Expo)
apps/web/               App web (Next.js): portal del cliente y panel web
supabase/migrations/    SQL versionado del esquema y RLS (lo usan las dos apps)
supabase/seed/          Datos de prueba
```

Dentro de `apps/mobile/`:

```
app/                    Rutas (Expo Router): cada archivo es una pantalla
  _layout.tsx           Sesión, rol y redirección al área correcta
  (auth)/               Login, registro de empresa, "únete a tu empresa"
  (admin)/              Pestañas del administrador
  (operario)/           Pestañas del técnico
  (cliente)/            Pestañas del cliente
  (superadmin)/         Panel de plataforma
  activo/[id].tsx       Ficha del equipo
  orden/[id].tsx        Detalle de orden
  q/[code].tsx          Destino del link impreso en el QR
  escanear.tsx          Escáner QR
  nueva-*.tsx, nuevo-*.tsx, invitar.tsx   Formularios (modales)
components/             Componentes compartidos (TextField, SelectField, AppModal, Animation…)
lib/                    Lógica sin UI: cliente de Supabase, dominios (assets, invitations, workOrders…)
assets/                 Íconos, splash y animaciones (assets/lottie/)
```

`android/` e `ios/` se generan solos (Continuous Native Generation) y están en `.gitignore`. Nunca se editan a mano: la configuración nativa va en `app.json`.

---

## Cómo funciona

### Invitaciones

No requieren la `service_role` key ni Edge Functions.

1. El admin crea una invitación (`invitations`) para un correo, como técnico o cliente. Vence en 14 días.
2. Comparte el enlace por WhatsApp u otra app. **La invitación no envía correo.**
3. La persona crea su cuenta en "¿Te invitó tu empresa? Crea tu cuenta" con **ese mismo correo**, y lo confirma.
4. Al iniciar sesión sin empresa, la app llama a `claim_my_invitation()`, que **solo funciona con el correo confirmado**. Asigna la empresa y el rol, y crea el técnico o vincula al cliente.
5. Si no hay invitación, la persona ve "Tu cuenta aún no tiene empresa" y puede volver a revisar más tarde.

### Códigos QR

- Cada equipo tiene un `qr_code` único (`FX-` + 10 caracteres), generado por la base de datos.
- El QR impreso contiene **`https://fixo.co/q/FX-…`**. Se configura con `EXPO_PUBLIC_ASSET_LINK_BASE`.
- **No cambiar el dominio una vez impresos los stickers**, porque es permanente. La app igual acepta cualquier dominio con `/q/FX-…`, además de `fixo://q/…` y el código solo, para que los stickers viejos sigan funcionando.
- La ruta `app/q/[code].tsx` usa el mismo camino `/q/…`. Cuando el dominio se conecte como universal link, el sticker abrirá la app directo en la ficha.

### Solicitudes de servicio

Un cliente pide un servicio desde el portal web; su empresa contratista lo acepta o rechaza desde la app móvil o desde la web.

1. El cliente crea la solicitud (`service_requests`, estado `nueva`) en `apps/web` → **Solicitar servicio** (`/cliente/solicitar`), para su empresa cliente y, opcionalmente, uno de sus equipos. RLS no le deja fijar el estado, la respuesta ni la orden. En su inicio ve el estado y, si se rechaza, el motivo.
2. El admin la ve en **Inicio → Solicitudes de clientes** (`apps/mobile/app/solicitudes.tsx` o `/admin/solicitudes` en la web).
3. **Aceptar** (`aceptar-solicitud/[id].tsx`): elige tipo, fecha y técnico, y llama a `accept_service_request()`. La función crea la orden y marca la solicitud como `aceptada` en una sola transacción. Es `SECURITY INVOKER`, así que aplican las políticas RLS del admin.
4. **Rechazar**: guarda el motivo en `response`. Solo funciona si la solicitud sigue `nueva`.

### Seguridad en la base de datos

- **RLS** decide *qué filas* ve y edita cada rol, siempre dentro de su empresa.
- **Triggers de guarda** deciden *qué columnas* puede cambiar cada rol:
  - un técnico solo cambia el estado de su orden (`pendiente → en_proceso → completada`) y sus notas;
  - un cliente solo aprueba o rechaza cotizaciones;
  - nadie cambia a un usuario de empresa desde la app.

---

## Convenciones

- **Idioma:** la interfaz va en español. El código, los nombres y los comentarios van en inglés.
- **Navegación:** solo Expo Router (`Link`, `router`, `useLocalSearchParams` de `expo-router`).
- **Datos en pantalla:** las listas cargan con `useFocusEffect` + `useCallback`, así se recargan al volver a la pantalla.
- **Modales:** usa `AppModal` (éxito, error, advertencia, info, confirmar) o `useModal()` en lugar de `Alert.alert`:
  ```ts
  const modal = useModal()
  if (await modal.confirm({ title: 'Cancelar invitación', destructive: true })) { … }
  await modal.alert({ variant: 'error', title: 'No se pudo guardar', message: 'Revisa tu conexión.' })
  ```
- **Animaciones:** archivos `.lottie` en `assets/lottie/`, registrados en `lib/animations.ts` y reproducidos con `<Animation>`. Siempre llevan un `fallback` estático (si falta el archivo o el usuario activó "reducir movimiento").
- **Expo cambia en cada SDK:** antes de usar una API de Expo, revisa la documentación de la versión instalada (`https://docs.expo.dev/versions/v58.0.0/`), no la memoria.
- **Dependencias** (política de la organización):
  - instalar con `yarn expo install` (en la app móvil), y las dependencias nuevas con **versión fija** (sin `^` ni `~`);
  - antes de agregar un paquete, revisar sus scripts `preinstall`, `install` y `postinstall`, su historial en Socket.dev, Snyk o GitHub Advisories, y preferir versiones con al menos dos semanas de publicadas;
  - correr `yarn audit` como mínimo una vez al mes;
  - ante un paquete comprometido, **rotar** los tokens de npm y GitHub y las credenciales cloud, no solo desinstalarlo.
- **Secretos:** nunca en el código ni en el repo. Usar `.env.local` o un gestor de secretos.
- **Despliegue:** infraestructura propia (GCP o Azure) y EAS para los builds móviles. **No usar Vercel.**
- **Revisión:** todo código, incluido el generado con IA, pasa por revisión humana antes de llegar a producción.

---

## Problemas conocidos al probar

- **La app te saca de la sesión a los pocos segundos:** revisa el reloj del dispositivo. Un emulador restaurado desde un snapshot puede tener la hora adelantada, y entonces cada token "vence" apenas llega. Se arregla activando la hora automática o con *Cold Boot* en Android Studio.
- **El correo de confirmación no llega:** es el límite del SMTP por defecto de Supabase (ver arriba). Para pruebas puedes confirmar a mano:
  ```sql
  update auth.users set email_confirmed_at = now()
  where email = 'correo@ejemplo.com' and email_confirmed_at is null;
  ```
- **El escáner QR no funciona en el emulador:** su cámara es virtual. Prueba en un teléfono físico.
- **`tsc` marca rutas nuevas como inválidas:** los tipos de Expo Router (`.expo/types/router.d.ts`) se regeneran al arrancar `yarn mobile`.
- **`npx` da `Cannot find module …\node_modules\node_modules\…`:** dentro del monorepo hay que usar `yarn` (ver [Comandos](#comandos)).

---

## Monorepo y dependencias

- **Workspaces de Yarn 1** (`apps/*`, `packages/*`). Se instala siempre desde la raíz con `yarn install`; hay **un solo `yarn.lock`**, en la raíz. No crear lockfiles por app ni usar `npm install`.
- **Una sola versión de React** para las dos apps: `react` y `react-dom` están fijados en `19.3.0` en `resolutions` del `package.json` raíz. Dos versiones de React en la misma app rompen en tiempo de ejecución.
- **Misma versión de TypeScript** en las dos apps (`~6.0.3`). Con versiones distintas, Yarn 1 enlaza mal los ejecutables de `node_modules/.bin`.
- **Tailwind distinto en cada app, a propósito:** el móvil usa Tailwind 3 (lo exige NativeWind 4) y la web Tailwind 4. Yarn deja cada versión dentro de su app.
- **Metro** (Expo SDK 58) se configura solo para monorepos; `apps/mobile/metro.config.js` no necesita `watchFolders` ni `nodeModulesPaths`.
- **Al crear el monorepo** (octubre 2026) se instaló con `--ignore-scripts` y se verificó que el lockfile no trajera versiones distintas a las que ya usaban las dos apps. El único paquete con script de instalación es `unrs-resolver` (lo usa ESLint); no necesita correrlo porque su binario nativo llega como dependencia opcional.
- La historia de la web viene del repo `fixo-web` (importado con `git subtree`); la del móvil, de `fixo-mobile`.

---

## Pendientes de la web

Problemas que la web ya traía antes del monorepo:

- **Tipos de Supabase:** la web ya pasa `yarn typecheck` y `yarn lint` sin errores y `next build` vuelve a revisar los tipos (se quitó `ignoreBuildErrors`). Las consultas usan tipos escritos a mano (`as unknown as …`); falta generar los tipos con `supabase gen types` para tener el cliente tipado.
- **Esquema viejo:** `apps/web/supabase/migrations/` (`001`–`005`) es el esquema de antes de multiempresa y ya no es la fuente de verdad (la web ya se revisó contra las migraciones de la raíz). Solo sirve como referencia de las tablas financieras, que se crearon con `005_financial.sql`; conviene moverlas a la migración base pendiente.
- **Despliegue:** no puede ir a Vercel. Para GCP (Cloud Run) o Azure, el build tiene que hacerse desde la raíz del monorepo (`yarn install` + `yarn workspace @fixo/web build`).
- **Variables de la web** (además de las de Supabase):
  - `NEXT_PUBLIC_SITE_URL`: URL pública de la web. Se usa en el enlace de confirmación del correo (`<url>/login?confirmado=1`) y en el enlace web de las invitaciones (`<url>/unirme?email=…`). Esa URL de confirmación debe estar en Supabase → Authentication → URL Configuration → Redirect URLs.
  - `NEXT_PUBLIC_ASSET_LINK_BASE`: dominio de los stickers QR (`<base>/q/<código>`). Debe ser el mismo valor que `EXPO_PUBLIC_ASSET_LINK_BASE` de la app; por defecto `https://fixo.co`.

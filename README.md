# Fixo

App móvil de gestión integral para **contratistas de servicios electromecánicos, mantenimiento y obras**. Una empresa contratista administra sus clientes, sus equipos (aires acondicionados, tableros eléctricos, bombas…) y su equipo técnico; los técnicos ejecutan las órdenes en campo; y los clientes consultan el estado e historial de sus equipos.

Construida con **Expo (SDK 58) + Expo Router + Supabase + NativeWind**. Android e iOS desde un único código.

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

### 🚧 Próximo

- Fotos de evidencia con marca de agua (fecha, hora y GPS).
- Fichaje de entrada y salida con geolocalización en el punto de trabajo.
- Checklists de inspección (RETIE / NTC 2050) y firma digital del cliente.
- Solicitud de servicios desde el portal del cliente.
- Animaciones Lottie (la base ya está en `components/Animation.tsx`; faltan los archivos en `assets/lottie/`).

### 📋 Después

- Cotizador con APU, AIU e impuestos; PDF y aprobación digital *(las tablas `apu_catalog`, `quotes`, `quote_items` e `invoices` ya existen, sin pantallas)*.
- Cuentas de cobro con estados (Pendiente, Abonado, Pagado, En mora) y recordatorios.
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
cp .env.example .env.local
```

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

> ⚠️ **Falta la migración base.** La primera migración modifica tablas (`profiles`, `clients`, `operators`, `assets`, `work_orders`, `maintenance_records`, `apu_catalog`, `quotes`, `quote_items`, `invoices`) que se crearon directamente en Supabase. Hoy no se puede recrear la base de datos desde el repo. Pendiente: `supabase db dump --schema public` y guardarlo como `20261028000000_baseline.sql`.

**Datos de prueba** (opcionales), en `supabase/seed/`:

- `demo_hdesarrollos.sql`: 3 clientes, 4 equipos y 5 órdenes en la empresa `HDESARROLLOS`.
- `attach_test_users.sql`: vincula dos usuarios ya creados como operario y cliente. Hoy es más fácil usar las invitaciones desde la app.

### 3. Configuración de Supabase Auth

- **Authentication → Providers → Email → "Confirm email": activado.** Es obligatorio: las invitaciones se reclaman solo con el correo confirmado.
- **Authentication → URL Configuration → Redirect URLs**: agregar `fixo://**` y, en desarrollo, la URL `exp://…` que muestra Expo.
- El correo por defecto de Supabase **solo envía a miembros del equipo del proyecto** y a pocos correos por hora. Antes de tener usuarios reales hay que configurar un SMTP propio (Resend, SendGrid…).

### 4. Correr la app

```bash
yarn install
npx expo start        # luego "a" para Android o escanear el QR con Expo Go
npx expo start -c     # igual, limpiando la caché (después de instalar dependencias)
```

---

## Comandos

```bash
npx expo start          # servidor de desarrollo
npx expo lint           # lint
npx tsc --noEmit        # typecheck
npx expo-doctor         # diagnóstico de dependencias y configuración
npx expo install <pkg>  # SIEMPRE así para agregar paquetes (versiones compatibles con el SDK)
```

Lint y typecheck deben pasar antes de dar una tarea por terminada.

---

## Estructura

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
supabase/migrations/    SQL versionado del esquema y RLS
supabase/seed/          Datos de prueba
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
  - instalar con `npx expo install`, y las dependencias nuevas con **versión fija** (sin `^` ni `~`);
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
- **`tsc` marca rutas nuevas como inválidas:** los tipos de Expo Router (`.expo/types/router.d.ts`) se regeneran al arrancar `npx expo start`.

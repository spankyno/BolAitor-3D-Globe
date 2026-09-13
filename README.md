# BolAitor 3D Globe

Una aplicación web de galería esférica en 3D interactiva construida con **React 19**, **Three.js** (`@react-three/fiber`), **Tailwind CSS v4** y **Vite**.

Permite explorar 48 destinos icónicos del mundo en un globo esférico con rotación libre, inercia de arrastre, penetración de zoom al interior de la esfera y fichas informativas detalladas con locución por voz y detalles históricos.

### Tus propias fotos en el globo: "Mis globos"

Desde el menú principal, cualquier usuario puede crear varios **globos con nombre** (p. ej. "Japón 2025", "Boda de Ana") y llenar cada uno con sus propias imágenes:

- **Archivos individuales**: selecciona una o varias imágenes (JPG, PNG, WEBP, GIF) desde el selector de archivos.
- **Archivo ZIP**: sube un `.zip` que contenga imágenes y la app las extrae automáticamente en el navegador (usando `JSZip`, sin subir nada a un servidor).

Cada globo se puede renombrar o eliminar por separado. Sin iniciar sesión, los globos creados solo viven en la memoria del navegador durante esa sesión; iniciando sesión con Google (ver sección siguiente), cada globo se guarda como una **subcarpeta** dentro de tu carpeta de Drive "BolAitor 3D Globe", y se recupera automáticamente la próxima vez que entres.

Las fotos se cargan como texturas de las tarjetas del globo 3D correspondiente.

### Hoja de ruta

- **Registro / inicio de sesión de usuarios**: ✅ implementado, centralizado con **[Clerk](https://clerk.com)** (registro, login con Google, gestión de sesión — plan gratuito de Clerk incluido, ver más abajo).
- **Almacenamiento en Google Drive**: ✅ implementado. Cada globo (colección con nombre) se guarda en su propia subcarpeta dentro de **"BolAitor 3D Globe"** en tu Google Drive, y se recupera automáticamente la próxima vez que inicies sesión.
- **Compartir un globo con enlace público**: ✅ implementado. Cualquier globo guardado en Drive se puede compartir con un enlace de solo lectura (`/share/<token>`) que cualquiera puede abrir sin iniciar sesión — ver la sección "🔗 Compartir un globo" más abajo.

---

## 🔑 Configurar Clerk (login) + Google Drive

Esta función es **opcional**: si no configuras nada, la app sigue funcionando igual (destinos curados, subir fotos sueltas o un ZIP), solo que esas fotos quedan únicamente en el navegador del usuario en esa sesión (no se guardan al recargar la página).

### Arquitectura

- **Clerk** centraliza todo el ciclo de usuario: pantallas de registro/login (email+contraseña, "Continuar con Google", etc.), sesión y gestión de cuenta — sin que tengas que programar nada de eso.
- Para guardar fotos en el **Drive** del usuario, la app necesita un *token de acceso de Google* con el scope `drive.file`. Clerk puede obtenerlo (si configuras tu propio Google OAuth Client dentro de Clerk con ese scope), pero solo lo expone de forma segura desde su **Backend API** (con tu Clerk Secret Key) — nunca directamente al navegador.
- Por eso la app incluye **una función serverless** en `functions/api/google-token.ts`, pensada para **Cloudflare Pages Functions** (se despliega automáticamente junto al resto de la app, sin servidor que mantener). Esa función verifica la sesión de Clerk del usuario y le pide a Clerk el token de Google, devolviéndolo al navegador para que este llame directamente a la API de Drive.
- El **scope `drive.file`** es no sensible: la app solo puede ver/gestionar los archivos que ella misma crea en Drive, nunca el resto del Drive del usuario.

### Paso 1: Crear las credenciales OAuth de Google (igual que antes)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) y crea un proyecto (o usa uno existente).
2. **APIs y servicios > Biblioteca** → busca **Google Drive API** → **Habilitar**.
3. **APIs y servicios > Pantalla de consentimiento de OAuth**:
   - Tipo de usuario: **Externo**.
   - Rellena nombre de la app, correo de soporte, etc.
   - Mientras esté en modo **Prueba (Testing)**, añade como usuarios de prueba los correos con los que quieras probar el login.
4. **APIs y servicios > Credenciales > Crear credenciales > ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**.
   - **Orígenes de JavaScript autorizados**: añade `http://localhost:5173` y tu dominio de producción (p. ej. `https://tu-dominio.pages.dev`).
   - **URI de redirección autorizados**: añade la URL de callback OAuth de Clerk, que encontrarás en el propio Dashboard de Clerk al configurar la conexión de Google (paso 3) — normalmente algo como `https://<tu-instancia>.clerk.accounts.dev/v1/oauth_callback`.
5. Copia el **Client ID** y el **Client Secret** generados.

### Paso 2: Crear la app en Clerk

1. Crea una cuenta gratuita en [clerk.com](https://clerk.com) y un nuevo proyecto/aplicación (p. ej. "BolAitor 3D Globe").
2. En **User & Authentication > Social Connections**, activa **Google**.
3. Elige **"Use custom credentials"** (imprescindible para poder pedir el scope de Drive — las credenciales compartidas de Clerk no lo permiten) y pega el **Client ID** y **Client Secret** de Google del paso anterior.
4. En **Scopes**, añade `https://www.googleapis.com/auth/drive.file` a los scopes solicitados por la conexión de Google.
5. En **API Keys**, copia la **Publishable key** (`pk_...`) y la **Secret key** (`sk_...`).

### Paso 3: Configurar las variables de entorno

**Frontend** — copia `.env.example` a `.env` (o `.env.local`):

```bash
VITE_CLERK_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Función serverless** (solo para desarrollo local) — copia `.dev.vars.example` a `.dev.vars`:

```bash
CLERK_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VITE_CLERK_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

`.env` y `.dev.vars` están en `.gitignore`: nunca los subas al repositorio.

En **Cloudflare Pages** (producción), ve a **Settings > Environment variables** del proyecto y añade:
- `VITE_CLERK_PUBLISHABLE_KEY` → pública, se puede marcar como variable normal.
- `CLERK_SECRET_KEY` → márcala como **secreta** (encrypted). Solo la usa la función `functions/api/google-token.ts`, nunca llega al navegador.

Si tu build de Cloudflare Pages usa `nodejs_compat` (recomendado para `@clerk/backend`), actívalo en **Settings > Functions > Compatibility flags** añadiendo `nodejs_compat`.

### Paso 4: Probar en local

```bash
npm install
npm run dev:functions   # hace build + sirve todo (frontend y /api/*) con wrangler
```

`npm run dev` (solo Vite) sirve el frontend, pero **no** ejecuta las funciones de `/functions` — para probar el login+Drive de extremo a extremo necesitas `npm run dev:functions`, que usa `wrangler pages dev` y lee los secretos de `.dev.vars`.

1. Abre la app, pulsa **"Iniciar sesión / Crear cuenta"** → se abre el modal de Clerk → elige "Continuar con Google".
2. Ve a **"Mis globos"**, crea uno nuevo y ábrelo: verás "Se guardan en tu Google Drive (tu-correo@gmail.com)".
3. Sube fotos (individuales o ZIP) y compruébalas en la carpeta **"BolAitor 3D Globe"** de tu Drive.
4. Cierra sesión y vuelve a entrar: tus fotos se recuperan automáticamente.

> Si el usuario se registró antes de activar el scope de Drive, o inició sesión con email/contraseña sin conectar Google, la app muestra un botón **"Conectar cuenta de Google" / "Conceder acceso a Google Drive"** para completarlo en cualquier momento.

> Si `VITE_CLERK_PUBLISHABLE_KEY` no está definida, todos los botones de login aparecen deshabilitados ("Login no configurado") y el resto de la app funciona con normalidad.

### Publicar fuera de "modo prueba" (opcional)

Mientras la pantalla de consentimiento de Google esté en modo **Testing**, solo los usuarios de prueba añadidos podrán conectar Google. Para permitir cualquier usuario, **publica** la app en la pantalla de consentimiento OAuth de Google. Como solo pides el scope no sensible `drive.file` (además de `email`/`profile`), no debería requerir la revisión de seguridad exhaustiva que sí exigen los scopes "sensibles" o "restringidos".

### Plan gratuito de Clerk

El plan gratuito de Clerk (Hobby) incluye un número de usuarios mensuales activos más que suficiente para un proyecto personal o una demo, sin necesidad de tarjeta de crédito. Revisa [clerk.com/pricing](https://clerk.com/pricing) para los límites exactos y vigentes.

---

## 🔗 Compartir un globo (enlace público de solo lectura)

Cualquier globo guardado en Drive se puede compartir con un enlace del tipo `https://tu-dominio.pages.dev/share/AbC123...`. Quien lo abra ve el globo 3D y puede explorarlo (arrastrar, hacer zoom, hacer clic en las fotos) **sin iniciar sesión ni necesitar cuenta de Google**.

### Cómo funciona (sin tocar los permisos de tus archivos en Drive)

En vez de hacer públicos los archivos en Google Drive, el enlace apunta a **dos funciones serverless nuevas** que hacen de proxy:

- `functions/api/share/[token]/meta.ts` — dado el token del enlace, busca a qué usuario y carpeta de Drive corresponde, pide el token de Google de **ese usuario** (el propietario, no el visitante) a través de Clerk, y devuelve el nombre del globo y la lista de fotos.
- `functions/api/share/[token]/photo/[fileId].ts` — sirve el contenido de una foto concreta, comprobando primero que esa foto pertenece de verdad a la carpeta compartida.

Es decir: **tus archivos de Drive siguen siendo privados** en todo momento; el visitante nunca recibe un token de Google ni accede a Drive directamente, todo pasa por tu propia función serverless.

Para resolver el token del enlace sin que el propietario esté conectado en ese momento, la app usa **Cloudflare Workers KV** (un almacén clave-valor) para guardar la relación `token → (usuario, carpeta)`. Es la única pieza de infraestructura nueva que hace falta:

- `functions/api/share/create.ts` — crea (o reutiliza) el enlace de un globo.
- `functions/api/share/status.ts` — comprueba si un globo ya está compartido.
- `functions/api/share/revoke.ts` — desactiva el enlace (deja de funcionar al instante).

### Configurar el KV namespace

**Desarrollo local**: no requiere ningún paso extra — `npm run dev:functions` ya arranca Wrangler con un KV local de pruebas (`--kv SHARE_KV`), que se guarda en `.wrangler/` y se puede borrar sin problema.

**Producción (Cloudflare Pages)**:

1. Crea el namespace una vez desde tu terminal:
   ```bash
   npx wrangler kv namespace create SHARE_KV
   ```
   Esto imprime un `id` — apúntalo.
2. En el dashboard de Cloudflare Pages, ve a tu proyecto → **Settings > Functions > KV namespace bindings** → **Add binding**:
   - **Variable name:** `SHARE_KV`
   - **KV namespace:** el que acabas de crear.
3. Guarda. La próxima vez que despliegues (git push o `wrangler pages deploy`), la función ya tendrá acceso a `env.SHARE_KV`.

Sin este binding configurado, los botones de "Compartir" mostrarán un error explicando que el KV no está configurado, pero el resto de la app (login, Drive, "Mis globos") sigue funcionando con normalidad.

### Usarlo desde la app

1. Abre un globo desde **"Mis globos"** (tiene que estar guardado en Drive, es decir, con la sesión iniciada).
2. Al final de la pantalla, pulsa **"Compartir este globo"**.
3. Copia el enlace generado con el botón de copiar. Pulsa **"Dejar de compartir"** en cualquier momento para desactivarlo (el enlace deja de funcionar al instante, aunque alguien lo tenga guardado).


> **Frontend estático + funciones serverless opcionales:** El globo, la carga de fotos (ZIP/imágenes) y toda la interfaz funcionan como una app 100% estática, sin backend. El login (Clerk), el guardado en Google Drive y el enlace de compartir público son opcionales y añaden un puñado de funciones serverless bajo `functions/api/`, pensadas para desplegarse gratis junto al resto de la app en **Cloudflare Pages Functions** — no hace falta un servidor propio. Sin esa configuración, la app sigue funcionando igual (destinos curados + fotos locales).

---

## 🚀 Despliegue en Cloudflare Pages

### Método 1: Conectar Repositorio de GitHub (Recomendado)

1. Sube este proyecto a tu repositorio de GitHub (ver sección *Subir a GitHub* abajo).
2. Entra en el panel de control de **[Cloudflare Dashboard](https://dash.cloudflare.com/)**.
3. En el menú lateral, ve a **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
4. Selecciona tu cuenta de GitHub y el repositorio que acabas de crear.
5. Configura los parámetros de compilación:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (o dejar en blanco) — importante: deja la carpeta `functions/` en la raíz del repo (fuera de `dist`), Cloudflare Pages la detecta y despliega automáticamente como funciones serverless.
   - **Environment variables:** `NODE_VERSION` = `20`, y si usas login/Drive, añade también `VITE_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY` (esta última como **secreta**) — ver la sección "🔑 Configurar Clerk" más arriba.
   - Si usas login/Drive, activa el compatibility flag `nodejs_compat` en **Settings > Functions > Compatibility flags** (necesario para `@clerk/backend`).
   - Si usas la función de compartir, añade el binding de KV `SHARE_KV` en **Settings > Functions > KV namespace bindings** — ver la sección "🔗 Compartir un globo" más arriba.
6. Haz clic en **Save and Deploy**. En pocos segundos tu aplicación estará activa globalmente en la red de Cloudflare con HTTPS automático y dominio `*.pages.dev`.

### Método 2: Despliegue Directo con Wrangler CLI

Si prefieres desplegar desde tu terminal sin vincular Git:

```bash
# 1. Instalar dependencias y compilar
npm install
npm run build

# 2. Desplegar la carpeta dist en Cloudflare Pages
# (ejecuta esto desde la raíz del proyecto: wrangler detecta la carpeta
# functions/ que está junto a dist/ y la despliega también)
npx wrangler pages deploy dist --project-name bolaitor-3d-globe
```

Si usas login/Drive, configura los secretos de producción una vez con:

```bash
npx wrangler pages secret put CLERK_SECRET_KEY --project-name bolaitor-3d-globe
npx wrangler pages secret put VITE_CLERK_PUBLISHABLE_KEY --project-name bolaitor-3d-globe
```

---

## 🐙 Cómo subir el código a un nuevo repositorio de GitHub

En tu terminal local en la raíz del proyecto:

```bash
# Inicializar git si no lo has hecho
git init

# Añadir todos los archivos
git add .

# Crear el primer commit
git commit -m "feat: release 100% static 3D globe for Cloudflare Pages"

# Renombrar rama a main
git branch -M main

# Vincular con tu repositorio remoto de GitHub (sustituye TU_USUARIO y TU_REPO)
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git

# Subir los cambios
git push -u origin main
```

---

## 💻 Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor de desarrollo local (solo frontend)
npm run dev

# 2b. Alternativa: frontend + funciones serverless (login/Drive) con Wrangler
npm run dev:functions

# 3. Compilar para producción (genera la carpeta dist/)
npm run build

# 4. Probar la compilación en local
npm run preview

# 5. Type-check (frontend y, por separado, las funciones)
npm run lint
npm run lint:functions
```

---

## 🛠️ Tecnologías Utilizadas

- **React 19**
- **Vite 6**
- **Three.js & @react-three/fiber & @react-three/drei** (Renderizado WebGL 3D en tiempo real)
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Motion** (Animaciones fluidas y transiciones de interfaz)
- **Lucide React** (Iconografía limpia y moderna)
- **Web Speech API** (Locución accesible de información turística en navegador)
- **JSZip** (extracción de imágenes desde archivos ZIP en el navegador)
- **Clerk** (`@clerk/clerk-react`, `@clerk/backend`) — registro, login (con Google) y gestión de sesión
- **Cloudflare Pages Functions** (`functions/api/`) — piezas serverless para el token de Drive y el sistema de enlaces compartidos
- **Cloudflare Workers KV** — almacén clave-valor usado para resolver los enlaces de "Compartir un globo"
- **Google Drive API v3** (REST, llamada directamente desde el navegador o desde las funciones serverless, según el caso)

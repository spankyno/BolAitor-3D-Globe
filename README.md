# BolAitor - Galería 3D Esférica Interactiva

Una aplicación web de galería esférica en 3D interactiva construida con **React 19**, **Three.js** (`@react-three/fiber`), **Tailwind CSS v4** y **Vite**.

Permite explorar 48 destinos icónicos del mundo en un globo esférico con rotación libre, inercia de arrastre, penetración de zoom al interior de la esfera y fichas informativas detalladas con locución por voz y detalles históricos.

> **100% Client-Side / Estática:** Esta versión es totalmente independiente de APIs externas o servicios de backend (prescinde al 100% de la API de Gemini). No requiere claves de API, secretos ni bases de datos. Es ideal para desplegar directamente en **Cloudflare Pages**, **GitHub Pages**, **Vercel** o cualquier CDN estático.

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
   - **Root directory:** `/` (o dejar en blanco)
   - **Environment variables (opcional):** `NODE_VERSION` = `20`
6. Haz clic en **Save and Deploy**. En pocos segundos tu aplicación estará activa globalmente en la red de Cloudflare con HTTPS automático y dominio `*.pages.dev`.

### Método 2: Despliegue Directo con Wrangler CLI

Si prefieres desplegar desde tu terminal sin vincular Git:

```bash
# 1. Instalar dependencias y compilar
npm install
npm run build

# 2. Desplegar la carpeta dist en Cloudflare Pages
npx wrangler pages deploy dist --project-name bolaitor-globe
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

# 2. Iniciar el servidor de desarrollo local
npm run dev

# 3. Compilar para producción (genera la carpeta dist/)
npm run build

# 4. Probar la compilación en local
npm run preview
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

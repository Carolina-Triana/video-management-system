# 🚀 Guía de Despliegue Paso a Paso

## ✅ Pre-requisitos Completados

- [x] RLS habilitado en Supabase (tabla videos y storage thumbnails)
- [x] Tests de integración pasando (11/11)
- [x] Helmet y rate limiting instalados
- [x] Archivos de configuración creados

## 📝 Información Importante

**Nueva API Key de Producción (guárdala en un lugar seguro):**

```
F1OnCPnluGAraq23EJRM29EKHL/yg5XN457umks0EbM=
```

---

## 🔧 Paso 1: Preparar el Repositorio Git

### 1.1 Inicializar Git (si no lo has hecho)

```bash
git init
git add .
git commit -m "Initial commit - Video Management System"
```

### 1.2 Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Crea un nuevo repositorio (por ejemplo: `video-management-system`)
3. NO inicialices con README, .gitignore o licencia
4. Copia la URL del repositorio

### 1.3 Conectar y subir el código

```bash
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git branch -M main
git push -u origin main
```

---

## 🚀 Paso 2: Desplegar Backend en Vercel

### 2.1 Crear cuenta en Vercel

1. Ve a https://vercel.com/signup
2. Regístrate con tu cuenta de GitHub
3. Autoriza a Vercel para acceder a tus repositorios

### 2.2 Importar proyecto

1. En el dashboard de Vercel, haz clic en **"Add New..."** > **"Project"**
2. Selecciona tu repositorio de GitHub
3. Haz clic en **"Import"**

### 2.3 Configurar el proyecto

**Framework Preset:** Other
**Root Directory:** `backend`
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

### 2.4 Configurar Variables de Entorno

Haz clic en **"Environment Variables"** y agrega:

```
SUPABASE_URL=https://cxntpvlfdplarpgkftvm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bnRwdmxmZHBsYXJwZ2tmdHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NzU5NzcsImV4cCI6MjA1MDE1MTk3N30.Ks-Ks-Ks-Ks-Ks-Ks-Ks-Ks-Ks-Ks-Ks-Ks-Ks
ADMIN_API_KEY=F1OnCPnluGAraq23EJRM29EKHL/yg5XN457umks0EbM=
PORT=3000
CORS_ORIGIN=*
NODE_ENV=production
```

**IMPORTANTE:**

- Usa tu `SUPABASE_URL` y `SUPABASE_ANON_KEY` reales del archivo `.env`
- Usa la nueva `ADMIN_API_KEY` generada arriba
- Después de desplegar el frontend, actualiza `CORS_ORIGIN` con la URL de Netlify

### 2.5 Desplegar

1. Haz clic en **"Deploy"**
2. Espera a que termine el despliegue (2-3 minutos)
3. Vercel te dará una URL como: `https://tu-proyecto.vercel.app`

### 2.6 Probar el backend

```bash
curl https://tu-proyecto.vercel.app/api/videos
```

Deberías ver la lista de videos (puede estar vacía: `[]`)

---

## 🌐 Paso 3: Desplegar Frontend en Netlify

### 3.1 Actualizar la configuración del frontend

Edita `admin/app.js` y actualiza la URL de la API:

```javascript
const config = {
  apiUrl: "https://TU-PROYECTO.vercel.app/api/videos",
  apiKey: "F1OnCPnluGAraq23EJRM29EKHL/yg5XN457umks0EbM=",
};
```

**Reemplaza:**

- `TU-PROYECTO.vercel.app` con tu URL real de Vercel
- Usa la nueva API key de producción

### 3.2 Commit y push los cambios

```bash
git add admin/app.js
git commit -m "Update API URL for production"
git push
```

### 3.3 Desplegar en Netlify

**Opción A: Drag & Drop (Más Rápido)**

1. Ve a https://app.netlify.com/drop
2. Arrastra la carpeta `admin` a la página
3. Netlify te dará una URL como: `https://random-name-123.netlify.app`

**Opción B: Desde GitHub (Recomendado)**

1. Ve a https://app.netlify.com
2. Haz clic en **"Add new site"** > **"Import an existing project"**
3. Selecciona **"GitHub"**
4. Selecciona tu repositorio
5. Configura:
   - **Base directory:** `admin`
   - **Build command:** (dejar vacío)
   - **Publish directory:** `.` (punto)
6. Haz clic en **"Deploy site"**

### 3.4 Configurar dominio personalizado (Opcional)

1. En Netlify, ve a **"Domain settings"**
2. Haz clic en **"Add custom domain"**
3. Sigue las instrucciones para configurar tu dominio

---

## 🔒 Paso 4: Actualizar CORS en el Backend

### 4.1 Actualizar variable de entorno en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a **"Settings"** > **"Environment Variables"**
3. Edita `CORS_ORIGIN` y cambia de `*` a tu URL de Netlify:
   ```
   CORS_ORIGIN=https://tu-sitio.netlify.app
   ```
4. Haz clic en **"Save"**

### 4.2 Re-desplegar

1. Ve a **"Deployments"**
2. Haz clic en los tres puntos del último deployment
3. Haz clic en **"Redeploy"**

---

## ✅ Paso 5: Verificar que Todo Funciona

### 5.1 Probar el frontend

1. Abre tu URL de Netlify en el navegador
2. Deberías ver el formulario de administración

### 5.2 Crear un video de prueba

1. Llena el formulario:
   - **Title:** "Video de Prueba Producción"
   - **Tags:** "test, producción"
   - **Iframe:** `<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>`
   - **Thumbnail:** Sube cualquier imagen
2. Haz clic en **"Create Video"**
3. Deberías ver un mensaje de éxito en verde

### 5.3 Verificar en Supabase

1. Ve a tu dashboard de Supabase
2. Ve a **"Table Editor"** > **"videos"**
3. Deberías ver el video que acabas de crear

### 5.4 Verificar en el backend

```bash
curl https://tu-proyecto.vercel.app/api/videos
```

Deberías ver el video en la respuesta JSON.

---

## 🎉 ¡Listo! Tu Sistema Está en Producción

### URLs de tu sistema:

- **Backend API:** `https://tu-proyecto.vercel.app`
- **Admin Interface:** `https://tu-sitio.netlify.app`
- **Supabase Dashboard:** `https://supabase.com/dashboard/project/cxntpvlfdplarpgkftvm`

### Credenciales importantes:

- **Admin API Key:** `F1OnCPnluGAraq23EJRM29EKHL/yg5XN457umks0EbM=`
- **Supabase URL:** (tu URL de Supabase)
- **Supabase Anon Key:** (tu anon key de Supabase)

**⚠️ IMPORTANTE:** Guarda estas credenciales en un lugar seguro (como un gestor de contraseñas).

---

## 🔧 Mantenimiento y Actualizaciones

### Actualizar el código

```bash
# Hacer cambios en el código
git add .
git commit -m "Descripción de los cambios"
git push
```

Vercel y Netlify desplegarán automáticamente los cambios.

### Ver logs

**Vercel:**

- Dashboard > Tu proyecto > Deployments > Clic en un deployment > Functions

**Netlify:**

- Dashboard > Tu sitio > Deploys > Clic en un deploy > Deploy log

---

## 🆘 Troubleshooting

### Error: CORS

**Problema:** El frontend no puede conectar con el backend

**Solución:**

1. Verifica que `CORS_ORIGIN` en Vercel incluya tu URL de Netlify
2. Asegúrate de que ambas URLs usen HTTPS
3. Re-despliega el backend después de cambiar CORS_ORIGIN

### Error: 401 Unauthorized

**Problema:** La API key no funciona

**Solución:**

1. Verifica que `ADMIN_API_KEY` en Vercel coincida con la del `admin/app.js`
2. Asegúrate de que el header sea exactamente `x-admin-key`

### Error: Videos no se crean

**Problema:** Error 500 al crear videos

**Solución:**

1. Verifica los logs en Vercel Dashboard
2. Asegúrate de que las políticas RLS estén habilitadas en Supabase
3. Verifica que `SUPABASE_URL` y `SUPABASE_ANON_KEY` sean correctas

---

## 📊 Costos

**Tier Gratuito:**

- Vercel: Gratis (100GB bandwidth/mes)
- Netlify: Gratis (100GB bandwidth/mes)
- Supabase: Gratis (500MB DB, 1GB Storage)
- **Total: $0/mes**

Este tier es suficiente para proyectos pequeños y medianos.

---

## 🎯 Próximos Pasos Opcionales

- [ ] Configurar dominio personalizado
- [ ] Agregar Google Analytics
- [ ] Implementar autenticación más robusta (JWT)
- [ ] Agregar más validaciones
- [ ] Implementar caché
- [ ] Agregar monitoreo (Sentry, LogRocket)

---

¡Felicidades! 🎊 Tu sistema de gestión de videos está ahora en producción.

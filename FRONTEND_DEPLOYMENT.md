# Frontend Deployment Guide - Netlify

## Resumen

Esta guía te ayudará a desplegar la interfaz de administración (frontend) en Netlify.

## ⚠️ Limitación Importante

La versión serverless en Vercel **NO soporta subida de archivos** (POST /api/videos con thumbnails).

**Operaciones disponibles en Vercel:**

- ✅ GET /api/videos - Listar videos
- ✅ GET /api/videos/:id - Obtener un video
- ✅ DELETE /api/videos/:id - Eliminar un video
- ❌ POST /api/videos - Crear video con thumbnail (NO FUNCIONA)

**Para crear videos con thumbnails necesitas:**

1. Ejecutar el backend localmente (`npm run dev` en `/backend`)
2. O desplegar el backend completo en un servidor tradicional (Railway, Render, Fly.io)

## Pasos para desplegar en Netlify

### 1. Crear cuenta en Netlify

- Ve a https://www.netlify.com/
- Crea una cuenta o inicia sesión

### 2. Conectar con GitHub

- Click en "Add new site" → "Import an existing project"
- Selecciona "Deploy with GitHub"
- Autoriza a Netlify para acceder a tu repositorio
- Selecciona el repositorio: `Carolina-Triana/video-management-system`

### 3. Configurar el deploy

**Build settings:**

- Base directory: `admin`
- Build command: (dejar vacío, no necesita build)
- Publish directory: `.` (punto, significa el directorio actual)

**O simplemente:**

- Base directory: (dejar vacío)
- Publish directory: `admin`

### 4. Deploy

- Click en "Deploy site"
- Espera a que termine el deploy (1-2 minutos)
- Netlify te dará una URL como: `https://random-name-123456.netlify.app`

### 5. Configurar dominio personalizado (opcional)

- En Netlify Dashboard → Site settings → Domain management
- Puedes cambiar el nombre del sitio o agregar un dominio personalizado

## URLs finales

Después del deploy tendrás:

- **Backend API**: https://video-management-system-rose.vercel.app/api/videos
- **Frontend Admin**: https://tu-sitio.netlify.app

## Actualizar CORS en Vercel

Una vez que tengas la URL de Netlify, actualiza la variable de entorno en Vercel:

1. Ve a Vercel Dashboard → tu proyecto → Settings → Environment Variables
2. Edita `CORS_ORIGIN`
3. Cambia de `*` a tu URL de Netlify: `https://tu-sitio.netlify.app`
4. Redeploy el proyecto en Vercel

Esto mejorará la seguridad al restringir qué dominios pueden acceder a tu API.

## Alternativa: Deploy manual con Netlify CLI

Si prefieres usar la línea de comandos:

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy desde el directorio admin
cd admin
netlify deploy --prod
```

## Solución para crear videos en producción

Si necesitas crear videos en producción, tienes 3 opciones:

### Opción 1: Backend local (desarrollo)

```bash
cd backend
npm run dev
```

Cambia `apiUrl` en `admin/app.js` a `http://localhost:3000/api/videos`

### Opción 2: Deploy backend en Railway/Render

1. Crea cuenta en Railway.app o Render.com
2. Conecta tu repositorio
3. Configura para desplegar desde `/backend`
4. Agrega las variables de entorno
5. Actualiza `apiUrl` en `admin/app.js` con la nueva URL

### Opción 3: Implementar presigned URLs de Supabase

Modificar el frontend para subir archivos directamente a Supabase Storage usando presigned URLs, sin pasar por el backend.

## Verificación

Después del deploy, verifica:

1. ✅ El frontend carga correctamente
2. ✅ Puedes ver la lista de videos (si hay videos en la BD)
3. ✅ Puedes eliminar videos
4. ⚠️ Crear videos NO funcionará (limitación de Vercel serverless)

## Soporte

Si tienes problemas:

- Revisa los logs en Netlify Dashboard
- Verifica que la URL del API en `admin/app.js` sea correcta
- Asegúrate de que CORS esté configurado correctamente en Vercel

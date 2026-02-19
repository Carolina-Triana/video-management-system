# Guía de Despliegue a Producción

## 📋 Checklist Pre-Despliegue

### 1. Seguridad de Supabase Storage

#### ✅ Habilitar RLS con Políticas Correctas

**IMPORTANTE:** NO despliegues con RLS deshabilitado. Sigue estos pasos:

1. **Ve a Storage > Policies en Supabase Dashboard**

2. **Habilita RLS** (si está deshabilitado)

3. **Crea 3 políticas usando la interfaz de Supabase:**

   **Política 1: Lectura Pública**

   ```
   Policy Name: Public read access
   Allowed operation: SELECT
   Target roles: public
   Policy definition: bucket_id = 'thumbnails'
   ```

   **Política 2: Subida de Archivos (Anon)**

   ```
   Policy Name: Allow anon uploads
   Allowed operation: INSERT
   Target roles: anon
   WITH CHECK expression: bucket_id = 'thumbnails'
   ```

   **Política 3: Eliminación de Archivos (Anon)**

   ```
   Policy Name: Allow anon deletes
   Allowed operation: DELETE
   Target roles: anon
   USING expression: bucket_id = 'thumbnails'
   ```

4. **Verifica que funciona:**
   ```bash
   cd backend
   node integration-test.js
   ```
   Todos los tests deben pasar (11/11).

---

## 🚀 Opciones de Despliegue

### Opción 1: Vercel (Recomendado - Más Fácil)

**Ventajas:**

- Despliegue automático desde Git
- HTTPS gratis
- Escalado automático
- Configuración simple

**Pasos:**

1. **Prepara el proyecto:**

   ```bash
   cd backend
   npm run build
   ```

2. **Crea `vercel.json` en la raíz del proyecto:**

   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "backend/src/app.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "backend/src/app.ts"
       }
     ]
   }
   ```

3. **Instala Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

4. **Despliega:**

   ```bash
   vercel
   ```

5. **Configura variables de entorno en Vercel Dashboard:**
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `ADMIN_API_KEY`
   - `CORS_ORIGIN` (tu dominio frontend)
   - `PORT=3000`

6. **Despliega a producción:**
   ```bash
   vercel --prod
   ```

---

### Opción 2: Railway (Alternativa Fácil)

**Ventajas:**

- Muy fácil de usar
- Soporte nativo para Node.js
- Base de datos incluida (opcional)

**Pasos:**

1. **Ve a [railway.app](https://railway.app)**

2. **Crea nuevo proyecto > Deploy from GitHub**

3. **Selecciona tu repositorio**

4. **Configura variables de entorno:**
   - Settings > Variables
   - Agrega todas las variables del `.env`

5. **Railway detectará automáticamente Node.js y desplegará**

---

### Opción 3: Render (Gratis con limitaciones)

**Ventajas:**

- Tier gratuito disponible
- Fácil configuración

**Pasos:**

1. **Ve a [render.com](https://render.com)**

2. **New > Web Service**

3. **Conecta tu repositorio de GitHub**

4. **Configura:**
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Environment: Node

5. **Agrega variables de entorno en el dashboard**

---

### Opción 4: VPS (DigitalOcean, AWS, etc.) - Más Control

**Para usuarios avanzados que quieren control total.**

**Pasos básicos:**

1. **Crea un servidor Ubuntu**

2. **Instala Node.js:**

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Instala PM2 (gestor de procesos):**

   ```bash
   sudo npm install -g pm2
   ```

4. **Clona tu repositorio:**

   ```bash
   git clone <tu-repo>
   cd <tu-repo>/backend
   npm install
   npm run build
   ```

5. **Crea archivo `.env` con tus variables**

6. **Inicia con PM2:**

   ```bash
   pm2 start dist/app.js --name video-api
   pm2 save
   pm2 startup
   ```

7. **Configura Nginx como reverse proxy:**

   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Instala SSL con Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d tu-dominio.com
   ```

---

## 🔒 Configuración de Seguridad para Producción

### 1. Variables de Entorno

**Actualiza tu `.env` para producción:**

```env
# Supabase (mantén las mismas)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key

# Admin API Key - GENERA UNA NUEVA Y SEGURA
ADMIN_API_KEY=genera-una-clave-muy-segura-aqui-min-32-caracteres

# Server
PORT=3000

# CORS - IMPORTANTE: Restringe a tu dominio
CORS_ORIGIN=https://tu-dominio-frontend.com
```

**Genera una API key segura:**

```bash
# En Linux/Mac:
openssl rand -base64 32

# En Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 2. Actualiza CORS en el código

Edita `backend/src/app.ts` para producción:

```typescript
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? process.env.CORS_ORIGIN : "*",
    credentials: true,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "x-admin-key"],
  }),
);
```

### 3. Agrega Helmet para headers de seguridad

```bash
npm install helmet
```

Actualiza `backend/src/app.ts`:

```typescript
import helmet from "helmet";

// Después de crear la app
app.use(helmet());
```

### 4. Agrega Rate Limiting

```bash
npm install express-rate-limit
```

Actualiza `backend/src/app.ts`:

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP
});

app.use("/api/", limiter);
```

---

## 🌐 Despliegue del Frontend (Admin Interface)

### Opción 1: Netlify (Recomendado)

1. **Crea `admin/netlify.toml`:**

   ```toml
   [build]
     publish = "."
   ```

2. **Actualiza `admin/app.js` con la URL de producción:**

   ```javascript
   const config = {
     apiUrl:
       process.env.NODE_ENV === "production"
         ? "https://tu-api-backend.vercel.app/api/videos"
         : "http://localhost:3000/api/videos",
     apiKey: "tu-admin-api-key-de-produccion",
   };
   ```

3. **Despliega a Netlify:**
   - Arrastra la carpeta `admin` a [netlify.com/drop](https://app.netlify.com/drop)
   - O conecta tu repositorio de GitHub

### Opción 2: Vercel (para el frontend)

```bash
cd admin
vercel
```

### Opción 3: GitHub Pages

1. **Crea un repositorio en GitHub**
2. **Sube la carpeta `admin`**
3. **Ve a Settings > Pages**
4. **Selecciona la rama y carpeta**
5. **GitHub Pages generará una URL**

---

## ✅ Checklist Final Pre-Producción

- [ ] RLS habilitado en Supabase Storage con políticas correctas
- [ ] Todas las variables de entorno configuradas en el servicio de hosting
- [ ] ADMIN_API_KEY cambiada a una clave segura (32+ caracteres)
- [ ] CORS_ORIGIN configurado con el dominio real del frontend
- [ ] Helmet instalado y configurado
- [ ] Rate limiting configurado
- [ ] Tests de integración pasando (11/11)
- [ ] Frontend actualizado con URL de API de producción
- [ ] SSL/HTTPS configurado (automático en Vercel/Netlify/Railway)
- [ ] Logs y monitoreo configurados

---

## 🧪 Pruebas Post-Despliegue

1. **Prueba la API en producción:**

   ```bash
   curl https://tu-api.vercel.app/api/videos
   ```

2. **Prueba crear un video desde el frontend:**
   - Abre tu admin interface en producción
   - Crea un video de prueba
   - Verifica que aparece en Supabase

3. **Verifica los logs:**
   - Vercel: Dashboard > Logs
   - Railway: Dashboard > Logs
   - Render: Dashboard > Logs

---

## 🔍 Monitoreo y Mantenimiento

### Logs

**Vercel:**

```bash
vercel logs <deployment-url>
```

**Railway:**

- Ve al dashboard y haz clic en "Logs"

**PM2 (VPS):**

```bash
pm2 logs video-api
```

### Actualizaciones

**Vercel/Railway/Render:**

- Push a GitHub → Despliegue automático

**VPS:**

```bash
cd <tu-repo>
git pull
cd backend
npm install
npm run build
pm2 restart video-api
```

---

## 🆘 Troubleshooting Común

### Error: CORS

**Problema:** Frontend no puede conectar con backend

**Solución:**

- Verifica que `CORS_ORIGIN` en el backend incluya el dominio del frontend
- Asegúrate de que ambos usen HTTPS

### Error: 401 Unauthorized

**Problema:** API key no funciona

**Solución:**

- Verifica que `ADMIN_API_KEY` en el backend coincida con la del frontend
- Revisa que el header sea exactamente `x-admin-key`

### Error: Storage upload fails

**Problema:** No se pueden subir thumbnails

**Solución:**

- Verifica que RLS esté habilitado con las políticas correctas
- Verifica que `SUPABASE_ANON_KEY` sea correcta

---

## 📊 Costos Estimados

**Tier Gratuito (Desarrollo/Proyectos Pequeños):**

- Supabase: Gratis (500MB DB, 1GB Storage)
- Vercel: Gratis (100GB bandwidth)
- Netlify: Gratis (100GB bandwidth)
- **Total: $0/mes**

**Tier Producción (Proyectos Medianos):**

- Supabase Pro: $25/mes (8GB DB, 100GB Storage)
- Vercel Pro: $20/mes (1TB bandwidth)
- **Total: ~$45/mes**

---

## 🎯 Recomendación Final

Para tu primer despliegue, te recomiendo:

1. **Backend:** Vercel o Railway (más fácil)
2. **Frontend:** Netlify (más fácil)
3. **Base de datos:** Supabase (ya lo tienes)

**Tiempo estimado de despliegue:** 30-60 minutos

**Ventajas:**

- Despliegue automático desde Git
- HTTPS gratis
- Escalado automático
- Sin configuración de servidores
- Tier gratuito generoso

¡Buena suerte con el despliegue! 🚀

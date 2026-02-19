# API Testing Guide

Este documento contiene comandos cURL para probar todos los endpoints de la API.

## Requisitos Previos

1. El servidor debe estar corriendo: `npm run dev` (en el directorio `backend/`)
2. El servidor estará disponible en: `http://localhost:3000`
3. Necesitas tu `ADMIN_API_KEY` del archivo `.env`

## Variables de Entorno

```bash
# Tu ADMIN_API_KEY (cámbiala por la tuya del archivo .env)
ADMIN_KEY="sb_publishable_TZ1KMuVU9YFdq0ciQNLn4Q_ZkqCaI7-"
```

## 1. GET /api/videos - Obtener todos los videos

**Descripción:** Obtiene todos los videos ordenados por fecha de creación (más recientes primero)

**Comando:**

```bash
curl -X GET http://localhost:3000/api/videos
```

**Respuesta esperada (si no hay videos):**

```json
[]
```

**Respuesta esperada (con videos):**

```json
[
  {
    "id": "v_abc12345",
    "title": "Mi Video",
    "thumbnailUrl": "https://cxntpvlfdplarpgkftvm.supabase.co/storage/v1/object/public/thumbnails/v_abc12345_1234567890.jpg",
    "iframeEmbed": "<iframe src=\"https://www.youtube.com/embed/test\"></iframe>",
    "tags": ["test", "demo"],
    "createdAt": "2024-02-19T03:00:00.000Z"
  }
]
```

---

## 2. POST /api/videos - Crear un nuevo video

**Descripción:** Crea un nuevo video con título, iframe embed, tags y thumbnail

**Requisitos:**

- Header `x-admin-key` con tu API key
- Archivo de imagen para el thumbnail

**Paso 1: Crear un archivo de imagen de prueba**

Ejecuta esto en el directorio `backend/`:

```bash
# Crear una imagen PNG de 1x1 pixel (para pruebas)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test-thumbnail.png
```

O simplemente usa cualquier imagen JPG/PNG que tengas.

**Paso 2: Ejecutar el comando POST**

```bash
curl -X POST http://localhost:3000/api/videos \
  -H "x-admin-key: sb_publishable_TZ1KMuVU9YFdq0ciQNLn4Q_ZkqCaI7-" \
  -F "title=Mi Primer Video" \
  -F "tags=test,demo,tutorial" \
  -F "iframeEmbed=<iframe src=\"https://www.youtube.com/embed/dQw4w9WgXcQ\" width=\"560\" height=\"315\"></iframe>" \
  -F "thumbnail=@test-thumbnail.png"
```

**Nota:** Reemplaza `test-thumbnail.png` con la ruta a tu imagen.

**Respuesta esperada (201 Created):**

```json
{
  "id": "v_abc12345",
  "title": "Mi Primer Video",
  "thumbnailUrl": "https://cxntpvlfdplarpgkftvm.supabase.co/storage/v1/object/public/thumbnails/v_abc12345_1234567890.png",
  "iframeEmbed": "<iframe src=\"https://www.youtube.com/embed/dQw4w9WgXcQ\" width=\"560\" height=\"315\"></iframe>",
  "tags": ["test", "demo", "tutorial"],
  "createdAt": "2024-02-19T03:00:00.000Z"
}
```

---

## 3. GET /api/videos/:id - Obtener un video por ID

**Descripción:** Obtiene un video específico por su ID

**Comando:**

```bash
# Reemplaza v_abc12345 con un ID real de tu base de datos
curl -X GET http://localhost:3000/api/videos/v_abc12345
```

**Respuesta esperada (200 OK):**

```json
{
  "id": "v_abc12345",
  "title": "Mi Primer Video",
  "thumbnailUrl": "https://cxntpvlfdplarpgkftvm.supabase.co/storage/v1/object/public/thumbnails/v_abc12345_1234567890.png",
  "iframeEmbed": "<iframe src=\"https://www.youtube.com/embed/dQw4w9WgXcQ\" width=\"560\" height=\"315\"></iframe>",
  "tags": ["test", "demo", "tutorial"],
  "createdAt": "2024-02-19T03:00:00.000Z"
}
```

**Respuesta esperada (404 Not Found):**

```json
{
  "error": "Video not found"
}
```

---

## 4. DELETE /api/videos/:id - Eliminar un video

**Descripción:** Elimina un video por su ID (requiere autenticación)

**Comando:**

```bash
# Reemplaza v_abc12345 con un ID real de tu base de datos
curl -X DELETE http://localhost:3000/api/videos/v_abc12345 \
  -H "x-admin-key: sb_publishable_TZ1KMuVU9YFdq0ciQNLn4Q_ZkqCaI7-"
```

**Respuesta esperada (204 No Content):**

```
(Sin contenido - solo código de estado 204)
```

**Respuesta esperada (404 Not Found):**

```json
{
  "error": "Video not found"
}
```

**Respuesta esperada (401 Unauthorized - sin API key):**

```json
{
  "error": "Unauthorized: Missing or invalid admin API key"
}
```

---

## Casos de Error

### 1. POST sin API key

```bash
curl -X POST http://localhost:3000/api/videos \
  -F "title=Test" \
  -F "tags=test" \
  -F "iframeEmbed=<iframe src=\"test\"></iframe>" \
  -F "thumbnail=@test-thumbnail.png"
```

**Respuesta (401):**

```json
{
  "error": "Unauthorized: Missing or invalid admin API key"
}
```

### 2. POST con título muy corto

```bash
curl -X POST http://localhost:3000/api/videos \
  -H "x-admin-key: sb_publishable_TZ1KMuVU9YFdq0ciQNLn4Q_ZkqCaI7-" \
  -F "title=AB" \
  -F "tags=test" \
  -F "iframeEmbed=<iframe src=\"test\"></iframe>" \
  -F "thumbnail=@test-thumbnail.png"
```

**Respuesta (400):**

```json
{
  "error": "Title must be at least 3 characters long"
}
```

### 3. POST sin thumbnail

```bash
curl -X POST http://localhost:3000/api/videos \
  -H "x-admin-key: sb_publishable_TZ1KMuVU9YFdq0ciQNLn4Q_ZkqCaI7-" \
  -F "title=Test Video" \
  -F "tags=test" \
  -F "iframeEmbed=<iframe src=\"test\"></iframe>"
```

**Respuesta (400):**

```json
{
  "error": "Thumbnail file is required"
}
```

### 4. POST con iframe inválido

```bash
curl -X POST http://localhost:3000/api/videos \
  -H "x-admin-key: sb_publishable_TZ1KMuVU9YFdq0ciQNLn4Q_ZkqCaI7-" \
  -F "title=Test Video" \
  -F "tags=test" \
  -F "iframeEmbed=<div>Not an iframe</div>" \
  -F "thumbnail=@test-thumbnail.png"
```

**Respuesta (400):**

```json
{
  "error": "iframeEmbed must contain <iframe and src= attributes"
}
```

---

## Flujo de Prueba Completo

Ejecuta estos comandos en orden para probar todo el flujo:

```bash
# 1. Verificar que el servidor está corriendo
curl http://localhost:3000/api/videos

# 2. Crear un video
curl -X POST http://localhost:3000/api/videos \
  -H "x-admin-key: sb_publishable_TZ1KMuVU9YFdq0ciQNLn4Q_ZkqCaI7-" \
  -F "title=Video de Prueba" \
  -F "tags=test,demo" \
  -F "iframeEmbed=<iframe src=\"https://www.youtube.com/embed/dQw4w9WgXcQ\"></iframe>" \
  -F "thumbnail=@test-thumbnail.png"

# 3. Obtener todos los videos (debería mostrar el video creado)
curl http://localhost:3000/api/videos

# 4. Obtener el video por ID (reemplaza VIDEO_ID con el ID del paso 2)
curl http://localhost:3000/api/videos/VIDEO_ID

# 5. Eliminar el video (reemplaza VIDEO_ID con el ID del paso 2)
curl -X DELETE http://localhost:3000/api/videos/VIDEO_ID \
  -H "x-admin-key: sb_publishable_TZ1KMuVU9YFdq0ciQNLn4Q_ZkqCaI7-"

# 6. Verificar que el video fue eliminado
curl http://localhost:3000/api/videos
```

---

## Notas Importantes

1. **Ubicación:** Ejecuta todos los comandos desde el directorio `backend/`
2. **Servidor:** Asegúrate de que el servidor esté corriendo con `npm run dev`
3. **API Key:** Reemplaza `sb_publishable_TZ1KMuVU9YFdq0ciQNLn4Q_ZkqCaI7-` con tu API key real del archivo `.env`
4. **Imágenes:** Usa imágenes reales (JPG, PNG, GIF) para el thumbnail
5. **CORS:** El servidor acepta peticiones de cualquier origen (`*`) en desarrollo

---

## Verificación de CORS

Para verificar que CORS está funcionando correctamente:

```bash
curl -X OPTIONS http://localhost:3000/api/videos \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

Deberías ver el header `Access-Control-Allow-Origin: *` en la respuesta.

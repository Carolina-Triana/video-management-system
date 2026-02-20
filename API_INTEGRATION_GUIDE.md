# Guía de Integración - Video Management API

## Información de la API

**URL Base:** `https://video-management-system-rose.vercel.app/api/videos`

**Endpoints Disponibles:**

- `GET /api/videos` - Obtener todos los videos
- `GET /api/videos/:id` - Obtener un video por ID
- `POST /api/videos` - Crear un nuevo video (requiere API key)
- `DELETE /api/videos/:id` - Eliminar un video (requiere API key)

---

## 1. Obtener Todos los Videos

```javascript
async function getAllVideos() {
  const response = await fetch(
    "https://video-management-system-rose.vercel.app/api/videos",
  );
  const videos = await response.json();
  return videos;
}

// Uso
const videos = await getAllVideos();
console.log(videos);
```

**Respuesta (Array de videos):**

```json
[
  {
    "id": "v_abc12345",
    "title": "Título del video",
    "thumbnailUrl": "https://cxntpvlfdplarpgkftvm.supabase.co/storage/v1/object/public/thumbnails/v_abc12345_1234567890.jpg",
    "iframeEmbed": "<iframe src='https://...' width='560' height='315'></iframe>",
    "tags": [],
    "createdAt": "2024-02-19T12:00:00.000Z"
  }
]
```

---

## 2. Obtener un Video por ID

```javascript
async function getVideoById(videoId) {
  const response = await fetch(
    `https://video-management-system-rose.vercel.app/api/videos/${videoId}`,
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Video no encontrado");
    }
    throw new Error("Error al obtener el video");
  }

  const video = await response.json();
  return video;
}

// Uso
const video = await getVideoById("v_abc12345");
console.log(video);
```

**Respuesta (Un video):**

```json
{
  "id": "v_abc12345",
  "title": "Título del video",
  "thumbnailUrl": "https://cxntpvlfdplarpgkftvm.supabase.co/storage/v1/object/public/thumbnails/v_abc12345_1234567890.jpg",
  "iframeEmbed": "<iframe src='https://...' width='560' height='315'></iframe>",
  "tags": [],
  "createdAt": "2024-02-19T12:00:00.000Z"
}
```

---

## 3. Estructura de Datos del Video

Cada video tiene los siguientes campos:

| Campo          | Tipo   | Descripción                                             |
| -------------- | ------ | ------------------------------------------------------- |
| `id`           | string | ID único del video (formato: `v_XXXXXXXX`)              |
| `title`        | string | Título del video                                        |
| `thumbnailUrl` | string | URL completa de la imagen miniatura en Supabase Storage |
| `iframeEmbed`  | string | Código HTML del iframe para embeber el video            |
| `tags`         | array  | Array de tags (actualmente siempre vacío `[]`)          |
| `createdAt`    | string | Fecha de creación en formato ISO 8601                   |

---

## 4. Ejemplo Completo - React Component

```jsx
import { useState, useEffect } from "react";

function VideoGallery() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const response = await fetch(
          "https://video-management-system-rose.vercel.app/api/videos",
        );
        if (!response.ok) throw new Error("Error al cargar videos");
        const data = await response.json();
        setVideos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  if (loading) return <div>Cargando videos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="video-gallery">
      {videos.map((video) => (
        <div key={video.id} className="video-card">
          <img src={video.thumbnailUrl} alt={video.title} />
          <h3>{video.title}</h3>
          <div dangerouslySetInnerHTML={{ __html: video.iframeEmbed }} />
        </div>
      ))}
    </div>
  );
}

export default VideoGallery;
```

---

## 5. Ejemplo Completo - Vanilla JavaScript

```javascript
// Configuración
const API_URL = "https://video-management-system-rose.vercel.app/api/videos";

// Función para cargar y mostrar videos
async function loadVideos() {
  try {
    const response = await fetch(API_URL);
    const videos = await response.json();

    const container = document.getElementById("videos-container");
    container.innerHTML = "";

    videos.forEach((video) => {
      const videoCard = document.createElement("div");
      videoCard.className = "video-card";
      videoCard.innerHTML = `
        <img src="${video.thumbnailUrl}" alt="${video.title}">
        <h3>${video.title}</h3>
        <div class="video-embed">${video.iframeEmbed}</div>
        <p class="date">Publicado: ${new Date(video.createdAt).toLocaleDateString()}</p>
      `;
      container.appendChild(videoCard);
    });
  } catch (error) {
    console.error("Error al cargar videos:", error);
    document.getElementById("videos-container").innerHTML =
      "<p>Error al cargar los videos. Por favor, intenta de nuevo.</p>";
  }
}

// Cargar videos al cargar la página
document.addEventListener("DOMContentLoaded", loadVideos);
```

**HTML necesario:**

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Galería de Videos</title>
  </head>
  <body>
    <div id="videos-container"></div>
    <script src="app.js"></script>
  </body>
</html>
```

---

## 6. Ejemplo con Vue.js

```vue
<template>
  <div class="video-gallery">
    <div v-if="loading">Cargando videos...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else class="videos-grid">
      <div v-for="video in videos" :key="video.id" class="video-card">
        <img :src="video.thumbnailUrl" :alt="video.title" />
        <h3>{{ video.title }}</h3>
        <div v-html="video.iframeEmbed"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      videos: [],
      loading: true,
      error: null,
    };
  },
  async mounted() {
    try {
      const response = await fetch(
        "https://video-management-system-rose.vercel.app/api/videos",
      );
      if (!response.ok) throw new Error("Error al cargar videos");
      this.videos = await response.json();
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  },
};
</script>
```

---

## 7. Manejo de Errores

```javascript
async function getVideosWithErrorHandling() {
  try {
    const response = await fetch(
      "https://video-management-system-rose.vercel.app/api/videos",
    );

    if (!response.ok) {
      switch (response.status) {
        case 404:
          throw new Error("Endpoint no encontrado");
        case 500:
          throw new Error("Error del servidor");
        default:
          throw new Error(`Error HTTP: ${response.status}`);
      }
    }

    const videos = await response.json();
    return videos;
  } catch (error) {
    console.error("Error al obtener videos:", error);
    throw error;
  }
}
```

---

## 8. Filtrado y Búsqueda (Frontend)

```javascript
// Filtrar videos por título
function filterVideosByTitle(videos, searchTerm) {
  return videos.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );
}

// Ordenar videos por fecha (más recientes primero)
function sortVideosByDate(videos) {
  return videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Uso
const videos = await getAllVideos();
const sortedVideos = sortVideosByDate(videos);
const filteredVideos = filterVideosByTitle(sortedVideos, "tutorial");
```

---

## 9. CORS - Dominios Permitidos

La API acepta requests desde cualquier origen (`*`), pero está optimizada para:

- `https://carolina-triana.github.io` (GitHub Pages)

Si despliegas tu frontend en otro dominio, funcionará sin problemas.

---

## 10. Notas Importantes

1. **No se requiere autenticación** para leer videos (GET)
2. **Los videos se devuelven ordenados** por fecha de creación (más recientes primero)
3. **El campo `tags` siempre es un array vacío** `[]` (funcionalidad deshabilitada)
4. **El `iframeEmbed` es HTML seguro** - ya está sanitizado en el backend
5. **Las URLs de thumbnails son públicas** - puedes usarlas directamente en `<img>`

---

## 11. Testing de la API

Puedes probar la API directamente desde el navegador o con curl:

```bash
# Obtener todos los videos
curl https://video-management-system-rose.vercel.app/api/videos

# Obtener un video específico
curl https://video-management-system-rose.vercel.app/api/videos/v_abc12345
```

O desde la consola del navegador:

```javascript
fetch("https://video-management-system-rose.vercel.app/api/videos")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## Soporte

Si tienes problemas con la integración, verifica:

1. La URL de la API está correcta
2. Tu frontend puede hacer requests CORS
3. Los videos existen en la base de datos (prueba el endpoint en el navegador)

¡Listo para integrar! 🚀

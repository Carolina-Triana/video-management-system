# Video Management System - Backend API

A Node.js/Express/TypeScript REST API for managing video records with Supabase storage.

## Prerequisites

Before setting up the backend, ensure you have:

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Supabase account** (free tier is sufficient)
  - Sign up at [supabase.com](https://supabase.com)

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in project details and wait for setup to complete
4. Note your project URL and anon key from Settings > API

### 2. Create the Videos Table

Run this SQL in the Supabase SQL Editor (Database > SQL Editor):

```sql
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  iframe_embed TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
```

### 3. Create the Thumbnails Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Click "New bucket"
3. Name it `thumbnails`
4. Make it **public** (check "Public bucket")
5. Click "Create bucket"

## Environment Variable Setup

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and fill in your values:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Admin Authentication
ADMIN_API_KEY=your-secret-admin-key-here

# Server Configuration
PORT=3000
CORS_ORIGIN=*
```

**Important:**

- Get `SUPABASE_URL` and `SUPABASE_ANON_KEY` from Supabase Settings > API
- Set `ADMIN_API_KEY` to a secure random string (this protects admin endpoints)
- `CORS_ORIGIN=*` allows all origins (restrict in production)

## Installation

Install dependencies:

```bash
npm install
```

## Running the Server

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the PORT you specified).

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

### GET /api/videos

Retrieve all videos sorted by creation date (newest first).

**Example:**

```bash
curl http://localhost:3000/api/videos
```

**Response (200 OK):**

```json
[
  {
    "id": "v_abc12345",
    "title": "My Video",
    "thumbnailUrl": "https://your-project.supabase.co/storage/v1/object/public/thumbnails/v_abc12345_1234567890.jpg",
    "iframeEmbed": "<iframe src=\"https://www.youtube.com/embed/test\"></iframe>",
    "tags": ["tutorial", "demo"],
    "createdAt": "2024-02-19T03:00:00.000Z"
  }
]
```

---

### GET /api/videos/:id

Retrieve a single video by ID.

**Example:**

```bash
curl http://localhost:3000/api/videos/v_abc12345
```

**Response (200 OK):**

```json
{
  "id": "v_abc12345",
  "title": "My Video",
  "thumbnailUrl": "https://your-project.supabase.co/storage/v1/object/public/thumbnails/v_abc12345_1234567890.jpg",
  "iframeEmbed": "<iframe src=\"https://www.youtube.com/embed/test\"></iframe>",
  "tags": ["tutorial", "demo"],
  "createdAt": "2024-02-19T03:00:00.000Z"
}
```

**Response (404 Not Found):**

```json
{
  "error": "Video not found"
}
```

---

### POST /api/videos

Create a new video record with thumbnail upload.

**Authentication:** Requires `x-admin-key` header

**Content-Type:** `multipart/form-data`

**Fields:**

- `title` (string, required): Video title (min 3 characters)
- `iframeEmbed` (string, required): HTML iframe embed code
- `tags` (string, optional): Comma-separated tags (max 10)
- `thumbnail` (file, required): Image file (JPG, PNG, GIF, max 5MB)

**Example:**

```bash
curl -X POST http://localhost:3000/api/videos \
  -H "x-admin-key: your-secret-admin-key-here" \
  -F "title=My First Video" \
  -F "tags=tutorial,demo,test" \
  -F "iframeEmbed=<iframe src=\"https://www.youtube.com/embed/dQw4w9WgXcQ\" width=\"560\" height=\"315\"></iframe>" \
  -F "thumbnail=@path/to/image.jpg"
```

**Response (201 Created):**

```json
{
  "id": "v_abc12345",
  "title": "My First Video",
  "thumbnailUrl": "https://your-project.supabase.co/storage/v1/object/public/thumbnails/v_abc12345_1234567890.jpg",
  "iframeEmbed": "<iframe src=\"https://www.youtube.com/embed/dQw4w9WgXcQ\" width=\"560\" height=\"315\"></iframe>",
  "tags": ["tutorial", "demo", "test"],
  "createdAt": "2024-02-19T03:00:00.000Z"
}
```

**Error Responses:**

```json
// 400 Bad Request - Missing thumbnail
{ "error": "Thumbnail file is required" }

// 400 Bad Request - Title too short
{ "error": "Title must be at least 3 characters long" }

// 400 Bad Request - Invalid iframe
{ "error": "iframeEmbed must contain <iframe and src= attributes" }

// 400 Bad Request - Too many tags
{ "error": "Cannot have more than 10 tags" }

// 401 Unauthorized - Missing/invalid API key
{ "error": "Unauthorized: Missing or invalid admin API key" }
```

---

### DELETE /api/videos/:id

Delete a video record and its thumbnail.

**Authentication:** Requires `x-admin-key` header

**Example:**

```bash
curl -X DELETE http://localhost:3000/api/videos/v_abc12345 \
  -H "x-admin-key: your-secret-admin-key-here"
```

**Response (204 No Content):**

```
(Empty response body)
```

**Error Responses:**

```json
// 404 Not Found
{ "error": "Video not found" }

// 401 Unauthorized
{ "error": "Unauthorized: Missing or invalid admin API key" }
```

## Testing the API

### Quick Test Flow

```bash
# 1. Check server is running
curl http://localhost:3000/api/videos

# 2. Create a test image (1x1 pixel PNG)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test.png

# 3. Create a video
curl -X POST http://localhost:3000/api/videos \
  -H "x-admin-key: your-secret-admin-key-here" \
  -F "title=Test Video" \
  -F "tags=test,demo" \
  -F "iframeEmbed=<iframe src=\"https://www.youtube.com/embed/dQw4w9WgXcQ\"></iframe>" \
  -F "thumbnail=@test.png"

# 4. Get all videos (should show the created video)
curl http://localhost:3000/api/videos

# 5. Get video by ID (replace VIDEO_ID with actual ID from step 3)
curl http://localhost:3000/api/videos/VIDEO_ID

# 6. Delete the video
curl -X DELETE http://localhost:3000/api/videos/VIDEO_ID \
  -H "x-admin-key: your-secret-admin-key-here"
```

### Running Automated Tests

```bash
npm test
```

## Project Structure

```
backend/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── routes/
│   │   └── videos.ts          # Video CRUD endpoints
│   ├── services/
│   │   └── supabase.ts        # Supabase client & operations
│   ├── middleware/
│   │   └── auth.ts            # API key authentication
│   └── utils/
│       ├── validators.ts      # Input validation & sanitization
│       └── idGenerator.ts     # Video ID generation
├── .env                       # Environment variables (not in git)
├── .env.example               # Environment template
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript configuration
```

## Security Considerations

### Current Implementation

- **API Key Authentication**: Simple header-based auth for admin operations
- **Input Validation**: Title length, iframe format, tag count limits
- **Iframe Sanitization**: Strips `<script>` tags, blocks `javascript:` protocol
- **File Upload Limits**: 5MB max, images only
- **CORS**: Enabled for all origins (development)

### Production Recommendations

1. **Authentication**: Implement JWT or OAuth instead of simple API keys
2. **CORS**: Restrict to specific domains in `CORS_ORIGIN`
3. **Rate Limiting**: Add rate limiting middleware (e.g., express-rate-limit)
4. **HTTPS**: Always use HTTPS in production
5. **Sanitization**: Consider using DOMPurify for robust HTML sanitization
6. **CSP**: Implement Content Security Policy headers
7. **Validation**: Add stricter file type validation and virus scanning
8. **Monitoring**: Add logging and error tracking (e.g., Sentry)

## Troubleshooting

### Server won't start

- Check that all environment variables are set in `.env`
- Verify Node.js version is 18 or higher: `node --version`
- Check if port 3000 is already in use

### Supabase connection errors

- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check that the videos table exists in your Supabase database
- Ensure the thumbnails bucket exists and is public

### File upload fails

- Check file size is under 5MB
- Verify file is an image (JPG, PNG, GIF)
- Ensure thumbnails bucket exists and is public in Supabase Storage

### 401 Unauthorized errors

- Verify `x-admin-key` header matches `ADMIN_API_KEY` in `.env`
- Check header name is exactly `x-admin-key` (lowercase)

## Additional Documentation

- **API Testing Guide**: See `API_TESTING.md` for detailed cURL examples
- **Requirements**: See `.kiro/specs/video-management-system/requirements.md`
- **Design Document**: See `.kiro/specs/video-management-system/design.md`

## License

ISC

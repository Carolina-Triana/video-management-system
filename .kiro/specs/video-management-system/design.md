# Design Document: Video Management System

## Overview

The video management system is a minimal fullstack application consisting of two main components:

1. **Backend API**: A Node.js/Express/TypeScript REST API that manages video records using Supabase (Postgres + Storage)
2. **Admin Interface**: A static HTML page with vanilla JavaScript for creating video records

The backend provides CRUD operations for video records, handles thumbnail uploads to Supabase Storage, and enforces basic security through API key authentication. The admin interface is a simple form that communicates with the backend API.

## Architecture

### System Components

```
┌─────────────────┐
│  Admin Interface│
│  (Static HTML)  │
└────────┬────────┘
         │ HTTP + x-admin-key
         ▼
┌─────────────────┐
│   Express API   │
│   (Node.js/TS)  │
└────────┬────────┘
         │
         ├──────────┐
         ▼          ▼
┌──────────────┐ ┌──────────────┐
│   Supabase   │ │   Supabase   │
│   Postgres   │ │   Storage    │
└──────────────┘ └──────────────┘
```

### Technology Stack

**Backend:**

- Node.js with TypeScript
- Express.js for HTTP server
- Multer for multipart/form-data handling
- @supabase/supabase-js for database and storage
- dotenv for configuration
- cors for cross-origin requests

**Frontend:**

- Vanilla JavaScript (ES6+)
- Tailwind CSS (CDN)
- Native Fetch API

**Infrastructure:**

- Supabase free tier (Postgres + Storage)

## Components and Interfaces

### Backend Components

#### 1. Express Application (app.ts)

Main application entry point that:

- Initializes Express server
- Configures middleware (CORS, JSON parsing)
- Registers routes
- Starts HTTP server

```typescript
interface ServerConfig {
  port: number;
  corsOrigin: string;
}
```

#### 2. Video Routes (routes/videos.ts)

Defines HTTP endpoints:

```typescript
// GET /api/videos
// Returns: Video[]

// GET /api/videos/:id
// Returns: Video | 404

// POST /api/videos
// Body: multipart/form-data
// Fields: title, iframeEmbed, tags (comma-separated), file (thumbnail)
// Returns: Video | 400 | 401

// DELETE /api/videos/:id
// Returns: 204 | 404 | 401
```

#### 3. Supabase Service (services/supabase.ts)

Handles all Supabase interactions:

```typescript
interface SupabaseService {
  // Database operations
  getAllVideos(): Promise<Video[]>;
  getVideoById(id: string): Promise<Video | null>;
  createVideo(data: CreateVideoData): Promise<Video>;
  deleteVideo(id: string): Promise<void>;

  // Storage operations
  uploadThumbnail(file: Buffer, filename: string): Promise<string>;
  deleteThumbnail(url: string): Promise<void>;
}
```

#### 4. Authentication Middleware (middleware/auth.ts)

Validates API key:

```typescript
interface AuthMiddleware {
  requireAdminKey(req: Request, res: Response, next: NextFunction): void;
}
```

#### 5. Validators (utils/validators.ts)

Input validation functions:

```typescript
interface Validators {
  validateTitle(title: string): ValidationResult;
  validateIframeEmbed(embed: string): ValidationResult;
  validateTags(tags: string[]): ValidationResult;
  sanitizeIframeEmbed(embed: string): string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}
```

### Frontend Components

#### Admin Interface (admin/index.html + admin/app.js)

Single-page application with:

```javascript
// Form elements
interface FormElements {
  titleInput: HTMLInputElement;
  tagsInput: HTMLInputElement;
  iframeEmbedTextarea: HTMLTextAreaElement;
  thumbnailInput: HTMLInputElement;
  submitButton: HTMLButtonElement;
}

// API client
interface VideoAPI {
  createVideo(formData: FormData): Promise<Video>;
}

// Event tracking
interface Analytics {
  logSubmitAttempt(): void;
  logSubmitSuccess(videoId: string): void;
  logSubmitError(message: string): void;
}
```

## Data Models

### Video Record

```typescript
interface Video {
  id: string; // Format: "v_" + 8 alphanumeric chars
  title: string; // Min 3 characters
  thumbnailUrl: string; // Public Supabase Storage URL
  iframeEmbed: string; // Sanitized iframe HTML string
  tags: string[]; // Max 10 tags
  createdAt: string; // ISO 8601 timestamp
}
```

### Database Schema

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

### Supabase Storage

```
Bucket: thumbnails
- Public read access
- Authenticated write access
- File naming: {videoId}_{timestamp}.{ext}
```

### Environment Configuration

```
# .env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
ADMIN_API_KEY=your-secret-key-here
PORT=3000
CORS_ORIGIN=*
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Video retrieval sorting

_For any_ set of video records with different creation timestamps, retrieving all videos should return them sorted by createdAt in descending order (newest first).

**Validates: Requirements 1.1**

### Property 2: Video creation and retrieval round-trip

_For any_ valid video data (title, iframe embed, tags, thumbnail), creating a video record and then retrieving it by ID should return a record with equivalent data.

**Validates: Requirements 1.2, 2.1**

### Property 3: Invalid ID returns 404

_For any_ string that is not a valid video ID in the database, attempting to retrieve or delete it should return a 404 error response.

**Validates: Requirements 1.3, 5.4**

### Property 4: Video ID format validation

_For any_ video created through the API, the generated ID should match the pattern "v\_" followed by exactly 8 alphanumeric characters.

**Validates: Requirements 2.2**

### Property 5: Timestamp format validation

_For any_ video created through the API, the createdAt field should be a valid ISO 8601 formatted timestamp.

**Validates: Requirements 2.3**

### Property 6: Thumbnail upload and accessibility

_For any_ valid image file uploaded as a thumbnail, the API should upload it to Supabase Storage and return a publicly accessible URL that can be retrieved.

**Validates: Requirements 2.4**

### Property 7: Tag parsing consistency

_For any_ comma-separated string of tags, creating a video with those tags and then retrieving it should return the tags as an array with trimmed whitespace and correct values.

**Validates: Requirements 2.5**

### Property 8: Authentication enforcement

_For any_ admin endpoint (POST /api/videos, DELETE /api/videos/:id), requests without a valid x-admin-key header should return a 401 unauthorized error.

**Validates: Requirements 2.6, 4.3, 5.3**

### Property 9: Title length validation

_For any_ title string with fewer than 3 characters, attempting to create a video should be rejected with a 400 error.

**Validates: Requirements 3.1**

### Property 10: Required fields validation

_For any_ video creation request missing required fields (title, iframeEmbed, or thumbnail), the API should reject it with a 400 error.

**Validates: Requirements 3.2, 3.3, 3.6**

### Property 11: Iframe embed format validation

_For any_ string that does not contain both "<iframe" and "src=", attempting to use it as an iframeEmbed should be rejected with a 400 error.

**Validates: Requirements 3.4**

### Property 12: Tag count limit enforcement

_For any_ array of tags with more than 10 elements, attempting to create a video should be rejected with a 400 error.

**Validates: Requirements 3.5**

### Property 13: Script tag sanitization

_For any_ iframe embed string containing `<script>` tags, the API should strip them before storing the embed.

**Validates: Requirements 4.1**

### Property 14: JavaScript protocol rejection

_For any_ iframe embed containing "javascript:" in the src attribute, the API should reject it with a 400 error.

**Validates: Requirements 4.2**

### Property 15: Video deletion completeness

_For any_ video record in the database, deleting it should remove both the database record and attempt to delete the associated thumbnail from storage, returning a 204 status.

**Validates: Requirements 5.1, 5.2, 5.5**

### Property 16: Form data construction

_For any_ valid form input (title, tags, iframe embed, thumbnail file), submitting the admin form should construct a FormData object containing all field values.

**Validates: Requirements 7.2**

### Property 17: Admin API request headers

_For any_ form submission from the admin interface, the POST request should include the x-admin-key header.

**Validates: Requirements 7.3**

### Property 18: Success feedback display

_For any_ successful API response (201 status), the admin interface should display a success message to the user.

**Validates: Requirements 7.4**

### Property 19: Error feedback display

_For any_ error API response (4xx or 5xx status), the admin interface should display the error message to the user.

**Validates: Requirements 7.5**

### Property 20: Console logging completeness

_For any_ form submission attempt, the admin interface should log "admin_submit_attempt", and then log either "admin_submit_success" with the video ID or "admin_submit_error" with the error message based on the API response.

**Validates: Requirements 8.1, 8.2, 8.3**

## Error Handling

### Backend Error Handling

**Validation Errors (400 Bad Request):**

- Missing required fields (title, iframeEmbed, thumbnail)
- Invalid title length (< 3 characters)
- Invalid iframe embed format (missing `<iframe` or `src=`)
- Invalid iframe embed content (contains `javascript:`)
- Too many tags (> 10)
- Invalid file type for thumbnail

**Authentication Errors (401 Unauthorized):**

- Missing x-admin-key header
- Invalid x-admin-key value

**Not Found Errors (404 Not Found):**

- Video ID does not exist in database

**Server Errors (500 Internal Server Error):**

- Supabase connection failures
- File upload failures
- Database query failures

**Error Response Format:**

```typescript
interface ErrorResponse {
  error: string; // Human-readable error message
  code?: string; // Optional error code for client handling
}
```

### Frontend Error Handling

**Network Errors:**

- Display user-friendly message: "Unable to connect to server"
- Log full error to console

**API Errors:**

- Parse error response from API
- Display error message from API response
- Log structured error event

**Validation Errors:**

- Client-side validation before submission (optional enhancement)
- Display API validation errors clearly

## Testing Strategy

### Dual Testing Approach

This system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**

- Specific examples demonstrating correct behavior
- Edge cases (empty strings, boundary values, special characters)
- Error conditions (missing fields, invalid formats)
- Integration points (Supabase client, multer middleware)

**Property-Based Tests:**

- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Each test references its design document property

### Property-Based Testing Configuration

**Library Selection:**

- Use `fast-check` for TypeScript/JavaScript property-based testing
- Configure each test to run minimum 100 iterations
- Tag format: `// Feature: video-management-system, Property {number}: {property_text}`

**Example Property Test Structure:**

```typescript
import fc from "fast-check";

// Feature: video-management-system, Property 2: Video creation and retrieval round-trip
test("created videos can be retrieved with equivalent data", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        title: fc.string({ minLength: 3, maxLength: 100 }),
        iframeEmbed: fc
          .string()
          .filter((s) => s.includes("<iframe") && s.includes("src=")),
        tags: fc.array(fc.string(), { maxLength: 10 }),
      }),
      async (videoData) => {
        const created = await createVideo(videoData);
        const retrieved = await getVideoById(created.id);
        expect(retrieved).toMatchObject({
          title: videoData.title,
          tags: videoData.tags,
        });
      },
    ),
    { numRuns: 100 },
  );
});
```

### Testing Scope

**Backend Tests:**

- API endpoint behavior (all CRUD operations)
- Input validation (all validation rules)
- Authentication middleware
- Sanitization functions
- Supabase service methods
- ID generation uniqueness

**Frontend Tests:**

- Form submission behavior
- FormData construction
- API client request formatting
- Console logging events
- Success/error message display
- DOM element presence

### Test Environment

**Backend:**

- Use Supabase test project or local Supabase instance
- Mock file uploads for unit tests
- Use real Supabase client for integration tests
- Clean up test data after each test

**Frontend:**

- Use jsdom or similar for DOM testing
- Mock fetch API for unit tests
- Test against real backend for integration tests

## Implementation Notes

### ID Generation

Use a cryptographically secure random generator for video IDs:

```typescript
function generateVideoId(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "v_";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
```

### Iframe Sanitization

Basic sanitization approach (with limitations noted in comments):

```typescript
function sanitizeIframeEmbed(embed: string): string {
  // Remove script tags (basic protection)
  let sanitized = embed.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Reject if contains javascript: protocol
  if (sanitized.toLowerCase().includes("javascript:")) {
    throw new Error("Invalid iframe: javascript: protocol not allowed");
  }

  // Note: This is basic sanitization. For production, consider:
  // - Using a library like DOMPurify
  // - Implementing Content Security Policy
  // - Validating against allowed iframe domains

  return sanitized;
}
```

### CORS Configuration

```typescript
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    // For production, restrict to specific origins:
    // origin: ['https://yourdomain.com', 'https://admin.yourdomain.com']
  }),
);
```

### File Upload Configuration

```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});
```

### Admin Interface Styling

Use Tailwind's dark theme utilities and glassmorphism:

```html
<div
  class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900"
>
  <div
    class="backdrop-blur-lg bg-white/10 rounded-xl border border-white/20 shadow-2xl"
  >
    <!-- Form content -->
  </div>
</div>
```

### Environment Variables

Required environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `ADMIN_API_KEY`: Secret key for admin operations
- `PORT`: Server port (default: 3000)
- `CORS_ORIGIN`: Allowed CORS origin (default: \*)

### Deployment Considerations

**Backend:**

- Can be deployed to any Node.js hosting (Vercel, Railway, Render, etc.)
- Ensure environment variables are configured
- Supabase free tier limits: 500MB database, 1GB storage

**Frontend:**

- Can be hosted on any static hosting (Netlify, Vercel, GitHub Pages, etc.)
- Update API endpoint URL in app.js
- Update x-admin-key (consider using environment-specific builds)

### Security Considerations

**Current Implementation:**

- Simple API key authentication (suitable for internal tools)
- Basic iframe sanitization (strips scripts, blocks javascript:)
- CORS enabled (restrict in production)

**Production Enhancements:**

- Implement proper authentication (JWT, OAuth)
- Use DOMPurify or similar for robust sanitization
- Implement rate limiting
- Add request validation middleware
- Use HTTPS only
- Implement Content Security Policy
- Add input length limits
- Validate file types more strictly
- Add virus scanning for uploads

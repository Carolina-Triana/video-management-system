# Requirements Document

## Introduction

This document specifies the requirements for a minimal fullstack video management system consisting of a Node.js backend API with Supabase storage and a vanilla JavaScript admin interface. The system allows administrators to create, retrieve, and delete video records with thumbnail uploads. The API is designed to be consumed by an existing frontend application.

## Glossary

- **Video_API**: The Node.js Express backend service that handles video record operations
- **Admin_Interface**: The static HTML/JavaScript form for creating video records
- **Supabase_Client**: The Supabase SDK used for database and storage operations
- **Video_Record**: A data entity containing video metadata and embed information
- **Thumbnail_Storage**: The Supabase Storage bucket for storing thumbnail images
- **API_Key**: A secret token used to authenticate admin operations

## Requirements

### Requirement 1: Video Record Management

**User Story:** As an API consumer, I want to retrieve video records, so that I can display video content in my application.

#### Acceptance Criteria

1. WHEN a GET request is made to /api/videos, THE Video_API SHALL return an array of all video records sorted by creation date in descending order
2. WHEN a GET request is made to /api/videos/:id with a valid video ID, THE Video_API SHALL return the corresponding video record
3. WHEN a GET request is made to /api/videos/:id with an invalid video ID, THE Video_API SHALL return a 404 error response
4. THE Video_API SHALL include CORS headers allowing cross-origin requests from any origin

### Requirement 2: Video Record Creation

**User Story:** As an administrator, I want to create new video records with thumbnails, so that I can add content to the system.

#### Acceptance Criteria

1. WHEN a POST request is made to /api/videos with valid multipart form data, THE Video_API SHALL create a new video record and return it with a 201 status
2. WHEN creating a video record, THE Video*API SHALL generate a unique ID with the format "v*" followed by 8 alphanumeric characters
3. WHEN creating a video record, THE Video_API SHALL generate a createdAt timestamp in ISO 8601 format
4. WHEN a thumbnail file is uploaded, THE Video_API SHALL upload it to the Supabase Storage bucket named "thumbnails" and store the public URL
5. WHEN tags are provided as a comma-separated string, THE Video_API SHALL parse them into an array and store them
6. WHEN a POST request is made without a valid x-admin-key header, THE Video_API SHALL return a 401 unauthorized error

### Requirement 3: Input Validation

**User Story:** As a system administrator, I want input validation on video records, so that only valid data is stored in the system.

#### Acceptance Criteria

1. WHEN a video record is submitted with a title shorter than 3 characters, THE Video_API SHALL reject it with a 400 error
2. WHEN a video record is submitted without a title, THE Video_API SHALL reject it with a 400 error
3. WHEN a video record is submitted without an iframeEmbed field, THE Video_API SHALL reject it with a 400 error
4. WHEN an iframeEmbed does not contain both "<iframe" and "src=", THE Video_API SHALL reject it with a 400 error
5. WHEN more than 10 tags are provided, THE Video_API SHALL reject the request with a 400 error
6. WHEN a POST request is made without a thumbnail file, THE Video_API SHALL reject it with a 400 error

### Requirement 4: Security and Sanitization

**User Story:** As a security-conscious developer, I want basic XSS protection on iframe embeds, so that malicious scripts cannot be injected.

#### Acceptance Criteria

1. WHEN an iframeEmbed contains `<script>` tags, THE Video_API SHALL strip them from the content
2. WHEN an iframeEmbed contains "javascript:" in the src attribute, THE Video_API SHALL reject it with a 400 error
3. WHEN a request is made to admin endpoints without the x-admin-key header, THE Video_API SHALL return a 401 error
4. THE Video_API SHALL read the admin API key from an environment variable

### Requirement 5: Video Record Deletion

**User Story:** As an administrator, I want to delete video records, so that I can remove outdated or incorrect content.

#### Acceptance Criteria

1. WHEN a DELETE request is made to /api/videos/:id with a valid ID and API key, THE Video_API SHALL delete the video record from the database
2. WHEN a DELETE request is made to /api/videos/:id with a valid ID and API key, THE Video_API SHALL attempt to delete the associated thumbnail from Supabase Storage
3. WHEN a DELETE request is made without a valid x-admin-key header, THE Video_API SHALL return a 401 error
4. WHEN a DELETE request is made with an invalid video ID, THE Video_API SHALL return a 404 error
5. WHEN a video record is successfully deleted, THE Video_API SHALL return a 204 no content response

### Requirement 6: Database Schema

**User Story:** As a backend developer, I want a properly structured database schema, so that video data is stored consistently.

#### Acceptance Criteria

1. THE Video_API SHALL use a Supabase Postgres table named "videos"
2. THE videos table SHALL have a column "id" of type text as the primary key
3. THE videos table SHALL have columns: title (text), thumbnail_url (text), iframe_embed (text), tags (jsonb), created_at (timestamptz)
4. THE Video_API SHALL use the Supabase client library to interact with the database

### Requirement 7: Admin Interface Form

**User Story:** As an administrator, I want a simple web form to create video records, so that I can add content without using API tools.

#### Acceptance Criteria

1. THE Admin_Interface SHALL provide input fields for: title (text), tags (text), iframeEmbed (textarea), and thumbnail (file)
2. WHEN the form is submitted, THE Admin_Interface SHALL construct a FormData object with all field values
3. WHEN the form is submitted, THE Admin_Interface SHALL send a POST request to /api/videos with the x-admin-key header
4. WHEN the API returns a success response, THE Admin_Interface SHALL display a success message to the user
5. WHEN the API returns an error response, THE Admin_Interface SHALL display the error message to the user
6. THE Admin_Interface SHALL use Tailwind CSS via CDN for styling
7. THE Admin_Interface SHALL be a single static HTML file with embedded JavaScript

### Requirement 8: Admin Interface Analytics

**User Story:** As a product analyst, I want structured logging of admin actions, so that I can track usage patterns.

#### Acceptance Criteria

1. WHEN a user attempts to submit the form, THE Admin_Interface SHALL log "admin_submit_attempt" to the console
2. WHEN the API returns a successful response, THE Admin_Interface SHALL log "admin_submit_success" with the video ID to the console
3. WHEN the API returns an error response, THE Admin_Interface SHALL log "admin_submit_error" with the error message to the console

### Requirement 9: Admin Interface Design

**User Story:** As an administrator, I want a visually appealing and responsive interface, so that I can comfortably use it on different devices.

#### Acceptance Criteria

1. THE Admin_Interface SHALL use a dark theme color scheme
2. THE Admin_Interface SHALL use glassmorphism styling for the form panel
3. THE Admin_Interface SHALL be responsive and work on mobile and desktop screen sizes
4. THE Admin_Interface SHALL use only vanilla JavaScript without frameworks

### Requirement 10: Configuration and Documentation

**User Story:** As a developer setting up the system, I want clear documentation and configuration examples, so that I can quickly get the system running.

#### Acceptance Criteria

1. THE Video_API SHALL include a .env.example file with all required environment variables
2. THE Video_API SHALL include a README.md file with setup instructions
3. THE README SHALL include example cURL requests for all API endpoints
4. THE Video_API SHALL use dotenv to load environment variables
5. THE Video_API SHALL be runnable locally with "npm install" and "npm run dev" commands
6. THE Admin_Interface SHALL be openable directly in a browser or via a static file server

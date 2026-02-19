import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import videoRoutes from "./routes/videos";

/**
 * Video Management System - Express Application
 *
 * SECURITY CONSIDERATIONS:
 *
 * Current Security Measures:
 * 1. API Key Authentication: Simple x-admin-key header for admin operations
 *    - Suitable for internal tools and trusted environments
 *    - NOT suitable for public-facing applications
 *
 * 2. Input Validation: Basic validation on all user inputs
 *    - Title length, iframe format, tag count limits
 *    - See validators.ts for details
 *
 * 3. Iframe Sanitization: Basic XSS protection
 *    - Strips <script> tags and blocks javascript: protocol
 *    - Has limitations (see validators.ts for details)
 *
 * 4. CORS: Configurable cross-origin access
 *    - Default allows all origins (*)
 *    - Should be restricted in production
 *
 * Production Security Enhancements Required:
 *
 * Authentication & Authorization:
 * - Replace API key with JWT or OAuth 2.0
 * - Implement role-based access control (RBAC)
 * - Add session management with secure cookies
 * - Implement refresh token rotation
 *
 * Input Security:
 * - Use DOMPurify or similar for robust HTML sanitization
 * - Implement request size limits (already done via multer)
 * - Add rate limiting (e.g., express-rate-limit)
 * - Validate file types more strictly (magic number validation)
 * - Add virus scanning for uploaded files
 * - Implement input length limits on all fields
 *
 * Network Security:
 * - Enforce HTTPS only (no HTTP)
 * - Implement Content Security Policy (CSP) headers
 * - Add security headers (helmet.js):
 *   - X-Frame-Options: DENY
 *   - X-Content-Type-Options: nosniff
 *   - Strict-Transport-Security
 *   - X-XSS-Protection
 * - Restrict CORS to specific trusted origins
 *
 * Data Security:
 * - Encrypt sensitive data at rest
 * - Use parameterized queries (Supabase handles this)
 * - Implement audit logging for all admin actions
 * - Add data retention policies
 * - Implement backup and recovery procedures
 *
 * Infrastructure Security:
 * - Use environment variables for all secrets (already done)
 * - Never commit .env files to version control
 * - Implement IP allowlisting for admin endpoints
 * - Add monitoring and alerting for suspicious activity
 * - Regular security audits and dependency updates
 * - Use secrets management service (AWS Secrets Manager, etc.)
 *
 * API Security:
 * - Implement request signing for critical operations
 * - Add CSRF protection if using cookies
 * - Validate Content-Type headers
 * - Implement API versioning
 * - Add request/response logging (excluding sensitive data)
 */

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Security: Add Helmet for security headers
app.use(helmet());

// Security: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Configure CORS middleware with origin from environment
//
// CORS Configuration Options and Security Considerations:
//
// Current Configuration:
// - Uses wildcard (*) origin by default, allowing requests from ANY domain
// - Suitable for public APIs or development/testing environments
// - SECURITY RISK: Allows any website to make requests to this API
//
// Production Security Recommendations:
// 1. Restrict to specific origins:
//    origin: ['https://yourdomain.com', 'https://admin.yourdomain.com']
//
// 2. Use environment-based configuration:
//    origin: process.env.NODE_ENV === 'production'
//      ? ['https://yourdomain.com']
//      : '*'
//
// 3. Enable credentials if using cookies/sessions:
//    credentials: true
//    Note: Cannot use wildcard (*) when credentials is true
//
// 4. Additional CORS options to consider:
//    - methods: ['GET', 'POST', 'DELETE'] // Restrict allowed HTTP methods
//    - allowedHeaders: ['Content-Type', 'x-admin-key'] // Restrict headers
//    - exposedHeaders: ['X-Total-Count'] // Headers accessible to client
//    - maxAge: 86400 // Cache preflight requests for 24 hours
//    - preflightContinue: false // Pass preflight to next handler
//
// 5. For admin endpoints, consider additional protection:
//    - Separate CORS policy for admin routes
//    - IP allowlisting for admin operations
//    - Rate limiting on sensitive endpoints
//
// Example production configuration:
// app.use(cors({
//   origin: (origin, callback) => {
//     const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'x-admin-key']
// }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  }),
);

// Configure JSON body parser
app.use(express.json());

// Health check endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Video Management API is running",
    endpoints: {
      videos: "/api/videos",
    },
  });
});

// Register video routes at /api/videos
app.use("/api/videos", videoRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);

  // Handle multer errors
  if (err.message === "Only image files are allowed") {
    res.status(400).json({ error: err.message });
    return;
  }

  // Handle other errors
  res.status(500).json({ error: "Internal server error" });
});

// Export the app without starting the server
// This allows the app to be imported for testing without starting the server
export default app;

// Start server only when this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`CORS origin: ${process.env.CORS_ORIGIN || "*"}`);
  });
}

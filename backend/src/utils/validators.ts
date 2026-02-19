/**
 * Validation utilities for video management system
 * Provides input validation and sanitization functions
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates video title
 * Requirements: 3.1, 3.2
 * - Title must be provided (not empty)
 * - Title must be at least 3 characters long
 */
export function validateTitle(title: string): ValidationResult {
  if (!title || title.trim().length === 0) {
    return {
      valid: false,
      error: "Title is required",
    };
  }

  if (title.trim().length < 3) {
    return {
      valid: false,
      error: "Title must be at least 3 characters long",
    };
  }

  return { valid: true };
}

/**
 * Validates iframe embed code
 * Requirements: 3.3, 3.4
 * - iframeEmbed must be provided
 * - Must contain "<iframe" tag
 * - Must contain "src=" attribute
 */
export function validateIframeEmbed(embed: string): ValidationResult {
  if (!embed || embed.trim().length === 0) {
    return {
      valid: false,
      error: "iframeEmbed is required",
    };
  }

  const embedLower = embed.toLowerCase();

  if (!embedLower.includes("<iframe")) {
    return {
      valid: false,
      error: "iframeEmbed must contain an <iframe> tag",
    };
  }

  if (!embedLower.includes("src=")) {
    return {
      valid: false,
      error: "iframeEmbed must contain a src attribute",
    };
  }

  return { valid: true };
}

/**
 * Validates tags array
 * Requirements: 3.5
 * - Maximum of 10 tags allowed
 */
export function validateTags(tags: string[]): ValidationResult {
  if (tags.length > 10) {
    return {
      valid: false,
      error: "Maximum of 10 tags allowed",
    };
  }

  return { valid: true };
}

/**
 * Sanitizes iframe embed code
 * Requirements: 4.1, 4.2
 * - Strips <script> tags from the embed
 * - Rejects embeds containing "javascript:" protocol
 *
 * SECURITY CONSIDERATIONS:
 * This is basic sanitization with known limitations:
 *
 * Iframe Sanitization Limitations:
 * - Only removes <script> tags and javascript: protocol
 * - Does NOT prevent other XSS vectors (e.g., onerror, onload event handlers)
 * - Does NOT validate the iframe source domain
 * - Does NOT prevent clickjacking attacks
 * - Does NOT sanitize other potentially dangerous HTML attributes
 * - Regex-based sanitization can be bypassed with malformed HTML
 *
 * For production environments, implement additional security measures:
 * - Use a robust HTML sanitization library like DOMPurify
 * - Implement Content Security Policy (CSP) headers to restrict iframe sources
 * - Maintain an allowlist of trusted iframe domains (e.g., youtube.com, vimeo.com)
 * - Consider using iframe sandbox attribute to restrict capabilities
 * - Validate iframe URLs against a whitelist before storage
 * - Implement X-Frame-Options headers to prevent embedding your site
 */
export function sanitizeIframeEmbed(embed: string): string {
  // Check for javascript: protocol first (case-insensitive)
  // This prevents XSS attacks via javascript: URLs in src attributes
  if (embed.toLowerCase().includes("javascript:")) {
    throw new Error("Invalid iframe: javascript: protocol not allowed");
  }

  // Remove script tags (case-insensitive, handles multiline)
  // Regex explanation: Matches <script> opening tag, any content, and closing </script> tag
  // Limitation: Can be bypassed with malformed HTML or encoded characters
  const sanitized = embed.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  return sanitized;
}

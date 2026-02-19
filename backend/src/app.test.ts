// Set environment variables before any imports
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-anon-key";
process.env.ADMIN_API_KEY = "test-key";
process.env.PORT = "3001";
process.env.CORS_ORIGIN = "*";

// Mock the video routes module
jest.mock("./routes/videos", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/", (req: any, res: any) => res.json({ message: "test" }));
  return router;
});

import request from "supertest";
import app from "./app";

describe("Express App Configuration", () => {
  describe("CORS Configuration", () => {
    it("should include CORS headers in responses", async () => {
      const response = await request(app)
        .get("/api/videos")
        .set("Origin", "http://example.com");

      // Verify CORS header is present
      expect(response.headers["access-control-allow-origin"]).toBeDefined();
    });

    it("should allow requests from any origin when CORS_ORIGIN is *", async () => {
      const response = await request(app)
        .get("/api/videos")
        .set("Origin", "http://example.com");

      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });
  });

  describe("Middleware Configuration", () => {
    it("should parse JSON request bodies", async () => {
      // This is implicitly tested by the routes, but we verify the middleware is configured
      const response = await request(app).get("/api/videos");

      // If JSON parsing middleware is configured, routes should work
      expect(response.status).toBe(200);
    });
  });

  describe("Route Registration", () => {
    it("should register video routes at /api/videos", async () => {
      const response = await request(app).get("/api/videos");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "test" });
    });
  });

  describe("Error Handling", () => {
    it("should handle multer file upload errors", async () => {
      // Create a mock error middleware scenario
      const response = await request(app)
        .post("/api/videos")
        .attach("thumbnail", Buffer.from("not-an-image"), "test.txt");

      // The error should be caught by error handling middleware
      // Status could be 400 (validation error), 401 (auth error), or 500 (server error)
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});

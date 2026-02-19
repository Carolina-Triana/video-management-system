// Set environment variables before any imports
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-anon-key";
process.env.ADMIN_API_KEY = "test-key";

// Mock dependencies before imports
jest.mock("../services/supabase");
jest.mock("../utils/validators");
jest.mock("../utils/idGenerator");
jest.mock("../middleware/auth", () => ({
  requireAdminKey: (req: any, res: any, next: any) => next(),
}));

import request from "supertest";
import express, { Express } from "express";
import videoRoutes from "./videos";
import * as supabaseService from "../services/supabase";
import * as validators from "../utils/validators";
import * as idGenerator from "../utils/idGenerator";

describe("Video Routes", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/videos", videoRoutes);

    // Reset mocks
    jest.clearAllMocks();

    // Set up environment
    process.env.ADMIN_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.ADMIN_API_KEY;
  });

  describe("GET /api/videos", () => {
    it("should return all videos sorted by creation date", async () => {
      const mockVideos = [
        {
          id: "v_abc12345",
          title: "Video 1",
          thumbnailUrl: "https://example.com/thumb1.jpg",
          iframeEmbed: '<iframe src="https://example.com/video1"></iframe>',
          tags: ["tag1", "tag2"],
          createdAt: "2024-01-02T00:00:00Z",
        },
        {
          id: "v_def67890",
          title: "Video 2",
          thumbnailUrl: "https://example.com/thumb2.jpg",
          iframeEmbed: '<iframe src="https://example.com/video2"></iframe>',
          tags: ["tag3"],
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      (supabaseService.getAllVideos as jest.Mock).mockResolvedValue(mockVideos);

      const response = await request(app).get("/api/videos");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVideos);
      expect(supabaseService.getAllVideos).toHaveBeenCalledTimes(1);
    });

    it("should return 500 on service error", async () => {
      (supabaseService.getAllVideos as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app).get("/api/videos");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Failed to fetch videos" });
    });
  });

  describe("GET /api/videos/:id", () => {
    it("should return a video by ID", async () => {
      const mockVideo = {
        id: "v_abc12345",
        title: "Test Video",
        thumbnailUrl: "https://example.com/thumb.jpg",
        iframeEmbed: '<iframe src="https://example.com/video"></iframe>',
        tags: ["tag1"],
        createdAt: "2024-01-01T00:00:00Z",
      };

      (supabaseService.getVideoById as jest.Mock).mockResolvedValue(mockVideo);

      const response = await request(app).get("/api/videos/v_abc12345");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVideo);
      expect(supabaseService.getVideoById).toHaveBeenCalledWith("v_abc12345");
    });

    it("should return 404 when video not found", async () => {
      (supabaseService.getVideoById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get("/api/videos/v_notfound");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Video not found" });
    });

    it("should return 500 on service error", async () => {
      (supabaseService.getVideoById as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app).get("/api/videos/v_abc12345");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Failed to fetch video" });
    });
  });

  describe("POST /api/videos", () => {
    const validVideoData = {
      title: "Test Video",
      iframeEmbed: '<iframe src="https://example.com/video"></iframe>',
      tags: "tag1, tag2, tag3",
    };

    beforeEach(() => {
      // Mock validators to return valid by default
      (validators.validateTitle as jest.Mock).mockReturnValue({ valid: true });
      (validators.validateIframeEmbed as jest.Mock).mockReturnValue({
        valid: true,
      });
      (validators.validateTags as jest.Mock).mockReturnValue({ valid: true });
      (validators.sanitizeIframeEmbed as jest.Mock).mockImplementation(
        (embed) => embed,
      );

      // Mock ID generation
      (idGenerator.generateVideoId as jest.Mock).mockReturnValue("v_test1234");

      // Mock Supabase operations
      (supabaseService.generateThumbnailFilename as jest.Mock).mockReturnValue(
        "v_test1234_123456.jpg",
      );
      (supabaseService.uploadThumbnail as jest.Mock).mockResolvedValue(
        "https://example.com/thumb.jpg",
      );
      (supabaseService.createVideo as jest.Mock).mockResolvedValue({
        id: "v_test1234",
        title: "Test Video",
        thumbnailUrl: "https://example.com/thumb.jpg",
        iframeEmbed: '<iframe src="https://example.com/video"></iframe>',
        tags: ["tag1", "tag2", "tag3"],
        createdAt: "2024-01-01T00:00:00Z",
      });
    });

    it("should create a video with valid data", async () => {
      const response = await request(app)
        .post("/api/videos")
        .field("title", validVideoData.title)
        .field("iframeEmbed", validVideoData.iframeEmbed)
        .field("tags", validVideoData.tags)
        .attach("thumbnail", Buffer.from("fake-image"), "test.jpg");

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id", "v_test1234");
      expect(response.body).toHaveProperty("title", "Test Video");
      expect(supabaseService.createVideo).toHaveBeenCalled();
    });

    it("should return 400 when thumbnail is missing", async () => {
      const response = await request(app)
        .post("/api/videos")
        .field("title", validVideoData.title)
        .field("iframeEmbed", validVideoData.iframeEmbed)
        .field("tags", validVideoData.tags);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Thumbnail file is required" });
    });

    it("should return 400 when title is invalid", async () => {
      (validators.validateTitle as jest.Mock).mockReturnValue({
        valid: false,
        error: "Title must be at least 3 characters long",
      });

      const response = await request(app)
        .post("/api/videos")
        .field("title", "ab")
        .field("iframeEmbed", validVideoData.iframeEmbed)
        .field("tags", validVideoData.tags)
        .attach("thumbnail", Buffer.from("fake-image"), "test.jpg");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Title must be at least 3 characters long",
      });
    });

    it("should return 400 when iframe embed is invalid", async () => {
      (validators.validateIframeEmbed as jest.Mock).mockReturnValue({
        valid: false,
        error: "iframeEmbed must contain an <iframe> tag",
      });

      const response = await request(app)
        .post("/api/videos")
        .field("title", validVideoData.title)
        .field("iframeEmbed", "invalid embed")
        .field("tags", validVideoData.tags)
        .attach("thumbnail", Buffer.from("fake-image"), "test.jpg");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "iframeEmbed must contain an <iframe> tag",
      });
    });

    it("should return 400 when tags exceed limit", async () => {
      (validators.validateTags as jest.Mock).mockReturnValue({
        valid: false,
        error: "Maximum of 10 tags allowed",
      });

      const response = await request(app)
        .post("/api/videos")
        .field("title", validVideoData.title)
        .field("iframeEmbed", validVideoData.iframeEmbed)
        .field(
          "tags",
          "tag1,tag2,tag3,tag4,tag5,tag6,tag7,tag8,tag9,tag10,tag11",
        )
        .attach("thumbnail", Buffer.from("fake-image"), "test.jpg");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Maximum of 10 tags allowed" });
    });

    it("should return 400 when sanitization fails", async () => {
      (validators.sanitizeIframeEmbed as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid iframe: javascript: protocol not allowed");
      });

      const response = await request(app)
        .post("/api/videos")
        .field("title", validVideoData.title)
        .field("iframeEmbed", '<iframe src="javascript:alert(1)"></iframe>')
        .field("tags", validVideoData.tags)
        .attach("thumbnail", Buffer.from("fake-image"), "test.jpg");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Invalid iframe: javascript: protocol not allowed",
      });
    });

    it("should parse tags correctly", async () => {
      await request(app)
        .post("/api/videos")
        .field("title", validVideoData.title)
        .field("iframeEmbed", validVideoData.iframeEmbed)
        .field("tags", " tag1 , tag2 , tag3 ")
        .attach("thumbnail", Buffer.from("fake-image"), "test.jpg");

      expect(supabaseService.createVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ["tag1", "tag2", "tag3"],
        }),
      );
    });

    it("should handle empty tags", async () => {
      await request(app)
        .post("/api/videos")
        .field("title", validVideoData.title)
        .field("iframeEmbed", validVideoData.iframeEmbed)
        .attach("thumbnail", Buffer.from("fake-image"), "test.jpg");

      expect(supabaseService.createVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: [],
        }),
      );
    });
  });

  describe("DELETE /api/videos/:id", () => {
    it("should delete a video and its thumbnail", async () => {
      const mockVideo = {
        id: "v_abc12345",
        title: "Test Video",
        thumbnailUrl: "https://example.com/thumb.jpg",
        iframeEmbed: '<iframe src="https://example.com/video"></iframe>',
        tags: ["tag1"],
        createdAt: "2024-01-01T00:00:00Z",
      };

      (supabaseService.getVideoById as jest.Mock).mockResolvedValue(mockVideo);
      (supabaseService.deleteVideo as jest.Mock).mockResolvedValue(undefined);
      (supabaseService.deleteThumbnail as jest.Mock).mockResolvedValue(
        undefined,
      );

      const response = await request(app).delete("/api/videos/v_abc12345");

      expect(response.status).toBe(204);
      expect(supabaseService.getVideoById).toHaveBeenCalledWith("v_abc12345");
      expect(supabaseService.deleteVideo).toHaveBeenCalledWith("v_abc12345");
      expect(supabaseService.deleteThumbnail).toHaveBeenCalledWith(
        "https://example.com/thumb.jpg",
      );
    });

    it("should return 404 when video not found", async () => {
      (supabaseService.getVideoById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).delete("/api/videos/v_notfound");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Video not found" });
      expect(supabaseService.deleteVideo).not.toHaveBeenCalled();
    });

    it("should return 500 on service error", async () => {
      (supabaseService.getVideoById as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app).delete("/api/videos/v_abc12345");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Failed to delete video" });
    });
  });
});

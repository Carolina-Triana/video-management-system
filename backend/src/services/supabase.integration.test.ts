/**
 * Integration tests for Supabase database operations
 *
 * These tests require a real Supabase instance with:
 * - A 'videos' table with the correct schema
 * - Environment variables set in .env file
 *
 * Run with: npm test -- supabase.integration.test.ts
 *
 * Note: These tests will create and delete real data in your database
 */

import {
  getAllVideos,
  getVideoById,
  createVideo,
  deleteVideo,
  CreateVideoData,
} from "./supabase";

describe("Supabase Service - Integration Tests", () => {
  const testVideoId = "v_test1234";
  let createdVideoId: string | null = null;

  // Clean up any test data before running tests
  beforeAll(async () => {
    try {
      await deleteVideo(testVideoId);
    } catch (error) {
      // Ignore errors if video doesn't exist
    }
  });

  // Clean up after tests
  afterAll(async () => {
    if (createdVideoId) {
      try {
        await deleteVideo(createdVideoId);
      } catch (error) {
        console.error("Failed to clean up test video:", error);
      }
    }
  });

  describe("createVideo and getVideoById", () => {
    it("should create a video and retrieve it by ID", async () => {
      const videoData: CreateVideoData = {
        id: testVideoId,
        title: "Integration Test Video",
        thumbnailUrl: "https://example.com/test-thumb.jpg",
        iframeEmbed: '<iframe src="https://example.com/test-video"></iframe>',
        tags: ["test", "integration"],
        createdAt: new Date().toISOString(),
      };

      // Create the video
      const created = await createVideo(videoData);
      createdVideoId = created.id;

      // Verify the created video has correct data
      expect(created.id).toBe(testVideoId);
      expect(created.title).toBe(videoData.title);
      expect(created.thumbnailUrl).toBe(videoData.thumbnailUrl);
      expect(created.iframeEmbed).toBe(videoData.iframeEmbed);
      expect(created.tags).toEqual(videoData.tags);
      // Supabase may return timestamps in different ISO 8601 formats
      // Compare as Date objects instead of strings
      expect(new Date(created.createdAt).getTime()).toBe(
        new Date(videoData.createdAt).getTime(),
      );

      // Retrieve the video by ID
      const retrieved = await getVideoById(testVideoId);

      // Verify the retrieved video matches
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(testVideoId);
      expect(retrieved?.title).toBe(videoData.title);
      expect(retrieved?.thumbnailUrl).toBe(videoData.thumbnailUrl);
      expect(retrieved?.iframeEmbed).toBe(videoData.iframeEmbed);
      expect(retrieved?.tags).toEqual(videoData.tags);
    });

    it("should return null for non-existent video ID", async () => {
      const result = await getVideoById("v_nonexist");
      expect(result).toBeNull();
    });
  });

  describe("getAllVideos", () => {
    it("should return videos sorted by created_at DESC", async () => {
      // Create two test videos with different timestamps
      const video1: CreateVideoData = {
        id: "v_sort0001",
        title: "Older Video",
        thumbnailUrl: "https://example.com/old.jpg",
        iframeEmbed: '<iframe src="https://example.com/old"></iframe>',
        tags: ["old"],
        createdAt: "2024-01-01T00:00:00Z",
      };

      const video2: CreateVideoData = {
        id: "v_sort0002",
        title: "Newer Video",
        thumbnailUrl: "https://example.com/new.jpg",
        iframeEmbed: '<iframe src="https://example.com/new"></iframe>',
        tags: ["new"],
        createdAt: "2024-01-02T00:00:00Z",
      };

      try {
        await createVideo(video1);
        await createVideo(video2);

        const videos = await getAllVideos();

        // Should have at least our two test videos
        expect(videos.length).toBeGreaterThanOrEqual(2);

        // Find our test videos
        const foundVideo1 = videos.find((v) => v.id === video1.id);
        const foundVideo2 = videos.find((v) => v.id === video2.id);

        expect(foundVideo1).toBeDefined();
        expect(foundVideo2).toBeDefined();

        // Newer video should come before older video
        const index1 = videos.findIndex((v) => v.id === video1.id);
        const index2 = videos.findIndex((v) => v.id === video2.id);
        expect(index2).toBeLessThan(index1);
      } finally {
        // Clean up
        await deleteVideo(video1.id).catch(() => {});
        await deleteVideo(video2.id).catch(() => {});
      }
    });
  });

  describe("deleteVideo", () => {
    it("should delete a video successfully", async () => {
      const videoData: CreateVideoData = {
        id: "v_delete01",
        title: "Video to Delete",
        thumbnailUrl: "https://example.com/delete.jpg",
        iframeEmbed: '<iframe src="https://example.com/delete"></iframe>',
        tags: ["delete"],
        createdAt: new Date().toISOString(),
      };

      // Create a video
      await createVideo(videoData);

      // Verify it exists
      const beforeDelete = await getVideoById(videoData.id);
      expect(beforeDelete).not.toBeNull();

      // Delete it
      await deleteVideo(videoData.id);

      // Verify it's gone
      const afterDelete = await getVideoById(videoData.id);
      expect(afterDelete).toBeNull();
    });
  });
});

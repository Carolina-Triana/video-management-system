import { Router, Request, Response } from "express";
import multer from "multer";
import {
  getAllVideos,
  getVideoById,
  createVideo,
  deleteVideo,
  uploadThumbnail,
  deleteThumbnail,
  generateThumbnailFilename,
} from "../services/supabase";
import { requireAdminKey } from "../middleware/auth";
import {
  validateTitle,
  validateIframeEmbed,
  validateTags,
  sanitizeIframeEmbed,
} from "../utils/validators";
import { generateVideoId } from "../utils/idGenerator";

const router = Router();

// Configure multer for file uploads
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

/**
 * GET /api/videos
 * Retrieve all videos sorted by creation date (newest first)
 * Requirements: 1.1
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const videos = await getAllVideos();
    res.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

/**
 * GET /api/videos/:id
 * Retrieve a single video by ID
 * Requirements: 1.2, 1.3
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = await getVideoById(id);

    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    res.json(video);
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ error: "Failed to fetch video" });
  }
});

/**
 * POST /api/videos
 * Create a new video record with thumbnail upload
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2
 */
router.post(
  "/",
  requireAdminKey,
  upload.single("thumbnail"),
  async (req: Request, res: Response) => {
    try {
      const { title, iframeEmbed, tags } = req.body;
      const file = req.file;

      // Validate required fields
      if (!file) {
        res.status(400).json({ error: "Thumbnail file is required" });
        return;
      }

      // Validate title
      const titleValidation = validateTitle(title);
      if (!titleValidation.valid) {
        res.status(400).json({ error: titleValidation.error });
        return;
      }

      // Validate iframe embed
      const embedValidation = validateIframeEmbed(iframeEmbed);
      if (!embedValidation.valid) {
        res.status(400).json({ error: embedValidation.error });
        return;
      }

      // Parse and validate tags
      let tagsArray: string[] = [];
      if (tags) {
        tagsArray = tags
          .split(",")
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag.length > 0);

        const tagsValidation = validateTags(tagsArray);
        if (!tagsValidation.valid) {
          res.status(400).json({ error: tagsValidation.error });
          return;
        }
      }

      // Sanitize iframe embed
      let sanitizedEmbed: string;
      try {
        sanitizedEmbed = sanitizeIframeEmbed(iframeEmbed);
      } catch (error) {
        res
          .status(400)
          .json({
            error:
              error instanceof Error ? error.message : "Invalid iframe embed",
          });
        return;
      }

      // Generate video ID and timestamp
      const videoId = generateVideoId();
      const createdAt = new Date().toISOString();

      // Upload thumbnail
      const thumbnailFilename = generateThumbnailFilename(
        videoId,
        file.originalname,
      );
      const thumbnailUrl = await uploadThumbnail(
        file.buffer,
        thumbnailFilename,
      );

      // Create video record
      const video = await createVideo({
        id: videoId,
        title: title.trim(),
        thumbnailUrl,
        iframeEmbed: sanitizedEmbed,
        tags: tagsArray,
        createdAt,
      });

      res.status(201).json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ error: "Failed to create video" });
    }
  },
);

/**
 * DELETE /api/videos/:id
 * Delete a video record and its thumbnail
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
router.delete("/:id", requireAdminKey, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if video exists
    const video = await getVideoById(id);
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    // Delete video from database
    await deleteVideo(id);

    // Attempt to delete thumbnail from storage
    await deleteThumbnail(video.thumbnailUrl);

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ error: "Failed to delete video" });
  }
});

export default router;

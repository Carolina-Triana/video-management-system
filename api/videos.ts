import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Updated: 2026-02-20 - Fixed CORS for multiple origins (force deploy v2)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS - Allow multiple origins (only return the requesting origin)
  const allowedOrigins = [
    "https://carolina-triana.github.io",
    "https://web-videos-front.pages.dev",
  ];

  const origin = req.headers.origin || "";

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-key");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url, method } = req;
  const path = url?.replace("/api/videos", "") || "/";

  try {
    // GET /api/videos - List all videos
    if (method === "GET" && path === "/") {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const videos = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        thumbnailUrl: row.thumbnail_url,
        iframeEmbed: row.iframe_embed,
        tags: row.tags || [],
        duration: row.duration || 0,
        createdAt: row.created_at,
      }));

      return res.status(200).json(videos);
    }

    // GET /api/videos/:id - Get single video
    if (method === "GET" && path.startsWith("/")) {
      const id = path.substring(1);

      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Video not found" });
        }
        throw error;
      }

      const video = {
        id: data.id,
        title: data.title,
        thumbnailUrl: data.thumbnail_url,
        iframeEmbed: data.iframe_embed,
        tags: data.tags || [],
        duration: data.duration || 0,
        createdAt: data.created_at,
      };

      return res.status(200).json(video);
    }

    // POST /api/videos - Create video (requires admin key)
    if (method === "POST" && path === "/") {
      const adminKey = req.headers["x-admin-key"];
      if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: "Invalid or missing API key" });
      }

      try {
        const { title, iframeEmbed, tags, thumbnailUrl, duration } = req.body;

        console.log(
          "API received duration:",
          duration,
          "Type:",
          typeof duration,
        );

        // Validate required fields
        if (!title || !iframeEmbed || !thumbnailUrl || duration === undefined) {
          return res.status(400).json({
            error:
              "Missing required fields: title, iframeEmbed, thumbnailUrl, duration",
          });
        }

        // Validate title
        if (title.trim().length < 3) {
          return res.status(400).json({
            error: "Title must be at least 3 characters long",
          });
        }

        // Validate iframe embed
        const embedLower = iframeEmbed.toLowerCase();
        if (!embedLower.includes("<iframe") || !embedLower.includes("src=")) {
          return res.status(400).json({
            error:
              "iframeEmbed must contain an <iframe> tag with src attribute",
          });
        }

        // Check for javascript: protocol
        if (embedLower.includes("javascript:")) {
          return res.status(400).json({
            error: "Invalid iframe: javascript: protocol not allowed",
          });
        }

        // Validate tags
        const tagsArray = Array.isArray(tags) ? tags : [];
        if (tagsArray.length > 10) {
          return res.status(400).json({
            error: "Maximum of 10 tags allowed",
          });
        }

        // Sanitize iframe embed (remove script tags)
        const sanitizedEmbed = iframeEmbed.replace(
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          "",
        );

        // Generate video ID
        const chars =
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let videoId = "v_";
        for (let i = 0; i < 8; i++) {
          videoId += chars[Math.floor(Math.random() * chars.length)];
        }

        const createdAt = new Date().toISOString();

        // Validate duration is a positive number
        console.log("Validating duration:", duration, "Type:", typeof duration);
        if (typeof duration !== "number" || duration < 0) {
          console.log("Duration validation FAILED");
          return res.status(400).json({
            error: "Duration must be a positive number (in seconds)",
          });
        }
        console.log("Duration validation PASSED");

        // Insert into database
        const { data, error: insertError } = await supabase
          .from("videos")
          .insert({
            id: videoId,
            title: title.trim(),
            thumbnail_url: thumbnailUrl,
            iframe_embed: sanitizedEmbed,
            tags: tagsArray,
            duration: duration,
            created_at: createdAt,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Return created video
        const video = {
          id: data.id,
          title: data.title,
          thumbnailUrl: data.thumbnail_url,
          iframeEmbed: data.iframe_embed,
          tags: data.tags || [],
          duration: data.duration,
          createdAt: data.created_at,
        };

        return res.status(201).json(video);
      } catch (error: any) {
        console.error("Error creating video:", error);
        return res
          .status(500)
          .json({ error: error.message || "Failed to create video" });
      }
    }

    // DELETE /api/videos/:id - Delete video (requires admin key)
    if (method === "DELETE" && path.startsWith("/")) {
      const adminKey = req.headers["x-admin-key"];
      if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: "Invalid or missing API key" });
      }

      const id = path.substring(1);

      // Check if video exists
      const { data: video, error: fetchError } = await supabase
        .from("videos")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          return res.status(404).json({ error: "Video not found" });
        }
        throw fetchError;
      }

      // Delete video
      const { error: deleteError } = await supabase
        .from("videos")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      // Try to delete thumbnail
      if (video.thumbnail_url) {
        const urlParts = video.thumbnail_url.split("/thumbnails/");
        if (urlParts.length >= 2) {
          const filename = urlParts[1];
          await supabase.storage.from("thumbnails").remove([filename]);
        }
      }

      return res.status(204).end();
    }

    // Route not found
    return res.status(404).json({ error: "Not found" });
  } catch (error: any) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}

// Force redeploy - 2026-02-19

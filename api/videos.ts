import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
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

      // Note: File upload not supported in this serverless version
      // This would need to be handled differently (e.g., presigned URLs)
      return res.status(501).json({
        error:
          "File upload not supported in serverless version. Use presigned URLs instead.",
      });
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

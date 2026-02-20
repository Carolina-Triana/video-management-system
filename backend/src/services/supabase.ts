import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables before accessing them
dotenv.config();

// Initialize Supabase client with URL and anon key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing required Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY",
  );
}

// Create and export configured Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
export interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  iframeEmbed: string;
  tags: string[];
  duration: number;
  createdAt: string;
}

export interface CreateVideoData {
  id: string;
  title: string;
  thumbnailUrl: string;
  iframeEmbed: string;
  tags: string[];
  duration: number;
  createdAt: string;
}

// Database operations

/**
 * Retrieve all videos sorted by creation date (newest first)
 * @returns Array of all video records
 */
export async function getAllVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }

  // Map database column names to camelCase
  return (data || []).map((row) => ({
    id: row.id,
    title: row.title,
    thumbnailUrl: row.thumbnail_url,
    iframeEmbed: row.iframe_embed,
    tags: row.tags || [],
    duration: row.duration || 0,
    createdAt: row.created_at,
  }));
}

/**
 * Retrieve a single video by ID
 * @param id - The video ID to retrieve
 * @returns Video record or null if not found
 */
export async function getVideoById(id: string): Promise<Video | null> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    // Return null for not found, throw for other errors
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch video: ${error.message}`);
  }

  // Map database column names to camelCase
  return {
    id: data.id,
    title: data.title,
    thumbnailUrl: data.thumbnail_url,
    iframeEmbed: data.iframe_embed,
    tags: data.tags || [],
    duration: data.duration || 0,
    createdAt: data.created_at,
  };
}

/**
 * Create a new video record in the database
 * @param data - Video data to insert
 * @returns The created video record
 */
export async function createVideo(data: CreateVideoData): Promise<Video> {
  console.log("Creating video with duration:", data.duration);

  const { data: insertedData, error } = await supabase
    .from("videos")
    .insert({
      id: data.id,
      title: data.title,
      thumbnail_url: data.thumbnailUrl,
      iframe_embed: data.iframeEmbed,
      tags: data.tags,
      duration: data.duration,
      created_at: data.createdAt,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create video: ${error.message}`);
  }

  console.log("Video created with duration:", insertedData.duration);

  // Map database column names to camelCase
  return {
    id: insertedData.id,
    title: insertedData.title,
    thumbnailUrl: insertedData.thumbnail_url,
    iframeEmbed: insertedData.iframe_embed,
    tags: insertedData.tags || [],
    duration: insertedData.duration || 0,
    createdAt: insertedData.created_at,
  };
}

/**
 * Delete a video record from the database
 * @param id - The video ID to delete
 * @throws Error if video not found or deletion fails
 */
export async function deleteVideo(id: string): Promise<void> {
  const { error } = await supabase.from("videos").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete video: ${error.message}`);
  }
}

// Storage operations

/**
 * Upload a thumbnail image to Supabase Storage
 * @param file - The file buffer to upload
 * @param filename - The filename to use in storage (should be unique)
 * @returns The public URL of the uploaded file
 */
export async function uploadThumbnail(
  file: Buffer,
  filename: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("thumbnails")
    .upload(filename, file, {
      contentType: "image/*",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload thumbnail: ${error.message}`);
  }

  // Get the public URL for the uploaded file
  const {
    data: { publicUrl },
  } = supabase.storage.from("thumbnails").getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Delete a thumbnail from Supabase Storage
 * @param url - The public URL of the thumbnail to delete
 * @throws Error if deletion fails (but doesn't throw if file doesn't exist)
 */
export async function deleteThumbnail(url: string): Promise<void> {
  // Extract the filename from the URL
  // URL format: https://{project}.supabase.co/storage/v1/object/public/thumbnails/{filename}
  const urlParts = url.split("/thumbnails/");
  if (urlParts.length < 2) {
    // Invalid URL format, but don't throw - just log and return
    console.warn(`Invalid thumbnail URL format: ${url}`);
    return;
  }

  const filename = urlParts[1];

  const { error } = await supabase.storage
    .from("thumbnails")
    .remove([filename]);

  if (error) {
    // Log the error but don't throw - deletion is best-effort
    console.error(`Failed to delete thumbnail: ${error.message}`);
  }
}

/**
 * Generate a unique filename for a thumbnail
 * @param videoId - The video ID to include in the filename
 * @param originalFilename - The original filename (to extract extension)
 * @returns A unique filename in the format: {videoId}_{timestamp}.{ext}
 */
export function generateThumbnailFilename(
  videoId: string,
  originalFilename: string,
): string {
  const timestamp = Date.now();

  // Extract extension from filename
  const parts = originalFilename.split(".");
  const extension = parts.length > 1 ? parts[parts.length - 1] : "jpg";

  return `${videoId}_${timestamp}.${extension}`;
}

// Configuration
const config = {
  apiUrl: "https://video-management-system-rose.vercel.app/api/videos",
  apiKey: "sb_publishable_TZ1KMuVU9YFdq0ciQNLn4Q_ZkqCaI7-",
  supabaseUrl: "https://cxntpvlfdplarpgkftvm.supabase.co",
  supabaseAnonKey: "sb_publishable_TZ1KMuVU9YFdq0ciQNLn4Q_ZkqCaI7-",
};

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);

// Generate video ID
function generateVideoId() {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "v_";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// Convert duration from MM:SS format to seconds
function durationToSeconds(duration) {
  const parts = duration.trim().split(":");
  if (parts.length !== 2) {
    throw new Error("Formato de duración inválido. Usa MM:SS (ejemplo: 4:05)");
  }

  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);

  if (isNaN(minutes) || isNaN(seconds)) {
    throw new Error("Duración debe contener solo números");
  }

  if (seconds >= 60) {
    throw new Error("Los segundos deben ser menores a 60");
  }

  return minutes * 60 + seconds;
}

// Upload thumbnail to Supabase Storage
async function uploadThumbnail(file, videoId) {
  const timestamp = Date.now();
  const extension = file.name.split(".").pop() || "jpg";
  const filename = `${videoId}_${timestamp}.${extension}`;

  const { data, error } = await supabaseClient.storage
    .from("thumbnails")
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload thumbnail: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabaseClient.storage.from("thumbnails").getPublicUrl(data.path);

  return publicUrl;
}

// Create video via API
async function createVideo(videoData) {
  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": config.apiKey,
    },
    body: JSON.stringify(videoData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`,
    );
  }

  return await response.json();
}

// Get form elements
const form = document.getElementById("videoForm");
const titleInput = document.getElementById("title");
const iframeEmbedTextarea = document.getElementById("iframeEmbed");
const durationInput = document.getElementById("duration");
const thumbnailInput = document.getElementById("thumbnail");
const submitButton = document.getElementById("submitButton");

// Function to check if all required fields are filled
function validateForm() {
  const isTitleValid = titleInput.value.trim().length >= 3;
  const isIframeValid = iframeEmbedTextarea.value.trim().length > 0;
  const isDurationValid = /^([0-9]+):([0-5][0-9])$/.test(
    durationInput.value.trim(),
  );
  const isThumbnailValid = thumbnailInput.files.length > 0;

  submitButton.disabled = !(
    isTitleValid &&
    isIframeValid &&
    isDurationValid &&
    isThumbnailValid
  );
}

// Add event listeners to validate form on input
titleInput.addEventListener("input", validateForm);
iframeEmbedTextarea.addEventListener("input", validateForm);
durationInput.addEventListener("input", validateForm);
thumbnailInput.addEventListener("change", validateForm);

// Form submit handler
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  console.log("admin_submit_attempt");

  submitButton.disabled = true;
  submitButton.textContent = "Subiendo miniatura...";

  try {
    // Validate thumbnail
    if (thumbnailInput.files.length === 0) {
      throw new Error("Por favor selecciona una imagen miniatura");
    }

    // Generate video ID
    const videoId = generateVideoId();

    // Upload thumbnail to Supabase Storage
    const thumbnailUrl = await uploadThumbnail(
      thumbnailInput.files[0],
      videoId,
    );

    console.log("Thumbnail uploaded successfully:", thumbnailUrl);

    submitButton.textContent = "Creando video...";

    // Convert duration to seconds
    const durationInSeconds = durationToSeconds(durationInput.value);

    // Create video via API
    const videoData = {
      title: titleInput.value,
      iframeEmbed: iframeEmbedTextarea.value,
      tags: [],
      thumbnailUrl: thumbnailUrl,
      duration: durationInSeconds,
    };

    console.log("Sending video data to API:", videoData);

    const video = await createVideo(videoData);

    console.log("admin_submit_success", { videoId: video.id });
    displayMessage(`¡Video creado exitosamente! ID: ${video.id}`, "success");
    form.reset();
    validateForm(); // Re-disable button after reset
  } catch (error) {
    console.log("admin_submit_error", { error: error.message });
    displayMessage(`Error: ${error.message}`, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Crear Video";
    validateForm(); // Re-validate after submission
  }
});

// Display message
function displayMessage(message, type) {
  const messageArea = document.getElementById("messageArea");
  const messageContent = document.getElementById("messageContent");

  messageContent.textContent = message;

  if (type === "success") {
    messageContent.className =
      "p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200";
  } else if (type === "error") {
    messageContent.className =
      "p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200";
  }

  messageArea.classList.remove("hidden");

  if (type === "success") {
    setTimeout(() => {
      messageArea.classList.add("hidden");
    }, 5000);
  }
}

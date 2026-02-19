// Configuration
const config = {
  apiUrl: "http://localhost:3000/api/videos",
  apiKey: "sb_publishable_TZ1KMuVU9YFdq0ciQNLn4Q_ZkqCaI7-", // Read from environment or prompt user in production
};

/**
 * Create a new video by posting FormData to the API
 * @param {FormData} formData - The form data containing video information and thumbnail
 * @returns {Promise<Object>} The created video object
 * @throws {Error} If the API request fails
 */
async function createVideo(formData) {
  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      "x-admin-key": config.apiKey,
    },
    body: formData,
  });

  // Handle error responses
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`,
    );
  }

  // Handle success response
  const video = await response.json();
  return video;
}

// Get references to form elements
const form = document.getElementById("videoForm");
const titleInput = document.getElementById("title");
const tagsInput = document.getElementById("tags");
const iframeEmbedTextarea = document.getElementById("iframeEmbed");
const thumbnailInput = document.getElementById("thumbnail");
const submitButton = document.getElementById("submitButton");

// Add submit event listener to form
form.addEventListener("submit", async (event) => {
  // Prevent default form submission
  event.preventDefault();

  // Log "admin_submit_attempt" to console
  console.log("admin_submit_attempt");

  // Construct FormData with all form field values
  const formData = new FormData();
  formData.append("title", titleInput.value);
  formData.append("iframeEmbed", iframeEmbedTextarea.value);

  // Parse tags from comma-separated string
  const tagsValue = tagsInput.value.trim();
  formData.append("tags", tagsValue);

  // Add thumbnail file
  if (thumbnailInput.files.length > 0) {
    formData.append("thumbnail", thumbnailInput.files[0]);
  }

  // Disable submit button during submission
  submitButton.disabled = true;
  submitButton.textContent = "Creating...";

  // Send FormData to API
  try {
    const video = await createVideo(formData);

    // On success (201): Display success message, log "admin_submit_success" with video ID, clear form
    console.log("admin_submit_success", { videoId: video.id });
    displayMessage(`Video created successfully! ID: ${video.id}`, "success");

    // Clear form
    form.reset();
  } catch (error) {
    // On error (4xx/5xx): Display error message, log "admin_submit_error" with error message
    console.log("admin_submit_error", { error: error.message });
    displayMessage(`Error: ${error.message}`, "error");
  } finally {
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.textContent = "Create Video";
  }
});

/**
 * Display a message in the message area with appropriate styling
 * @param {string} message - The message to display
 * @param {string} type - The type of message: "success" or "error"
 */
function displayMessage(message, type) {
  const messageArea = document.getElementById("messageArea");
  const messageContent = document.getElementById("messageContent");

  // Update message content
  messageContent.textContent = message;

  // Apply appropriate styling based on type
  if (type === "success") {
    messageContent.className =
      "p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200";
  } else if (type === "error") {
    messageContent.className =
      "p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200";
  }

  // Show message area
  messageArea.classList.remove("hidden");

  // Auto-hide success messages after 5 seconds
  if (type === "success") {
    setTimeout(() => {
      messageArea.classList.add("hidden");
    }, 5000);
  }
}

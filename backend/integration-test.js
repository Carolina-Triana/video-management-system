// Integration Test Script for Video Management System
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const API_URL = "http://localhost:3000/api/videos";
const API_KEY = "sb_publishable_TZ1KMuVU9YFdq0ciQNLn4Q_ZkqCaI7-";

let createdVideoId = null;

console.log("=== Video Management System Integration Test ===\n");

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === "https:" ? https : http;

    const req = protocol.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Helper function to create multipart form data
function createMultipartFormData(fields, file) {
  const boundary =
    "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  let body = "";

  // Add text fields
  for (const [key, value] of Object.entries(fields)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    body += `${value}\r\n`;
  }

  // Add file field
  if (file) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="thumbnail"; filename="${file.name}"\r\n`;
    body += `Content-Type: ${file.type}\r\n\r\n`;
    body += file.data.toString("binary") + "\r\n";
  }

  body += `--${boundary}--\r\n`;

  return {
    body: Buffer.from(body, "binary"),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

// Test 1: GET all videos (should be empty initially)
async function test1_GetAllVideos() {
  console.log("Test 1: GET /api/videos (initial state)");
  try {
    const response = await makeRequest(API_URL, { method: "GET" });
    console.log("  Status:", response.statusCode);
    console.log("  Response:", response.body);

    if (response.statusCode === 200) {
      console.log("  ✓ PASS: Successfully retrieved videos\n");
      return true;
    } else {
      console.log("  ✗ FAIL: Expected status 200\n");
      return false;
    }
  } catch (error) {
    console.log("  ✗ FAIL:", error.message, "\n");
    return false;
  }
}

// Test 2: POST create video without API key (should fail with 401)
async function test2_CreateVideoWithoutAuth() {
  console.log("Test 2: POST /api/videos without API key (should fail)");
  try {
    const formData = createMultipartFormData(
      {
        title: "Test Video",
        iframeEmbed: '<iframe src="https://example.com"></iframe>',
        tags: "test,demo",
      },
      null,
    );

    const response = await makeRequest(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": formData.contentType,
      },
      body: formData.body,
    });

    console.log("  Status:", response.statusCode);
    console.log("  Response:", response.body);

    if (response.statusCode === 401) {
      console.log("  ✓ PASS: Correctly rejected unauthorized request\n");
      return true;
    } else {
      console.log("  ✗ FAIL: Expected status 401\n");
      return false;
    }
  } catch (error) {
    console.log("  ✗ FAIL:", error.message, "\n");
    return false;
  }
}

// Test 3: POST create video with invalid data (should fail with 400)
async function test3_CreateVideoWithInvalidData() {
  console.log("Test 3: POST /api/videos with invalid title (should fail)");
  try {
    const formData = createMultipartFormData(
      {
        title: "ab", // Too short (< 3 chars)
        iframeEmbed: '<iframe src="https://example.com"></iframe>',
        tags: "test",
      },
      null,
    );

    const response = await makeRequest(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": formData.contentType,
        "x-admin-key": API_KEY,
      },
      body: formData.body,
    });

    console.log("  Status:", response.statusCode);
    console.log("  Response:", response.body);

    if (response.statusCode === 400) {
      console.log("  ✓ PASS: Correctly rejected invalid data\n");
      return true;
    } else {
      console.log("  ✗ FAIL: Expected status 400\n");
      return false;
    }
  } catch (error) {
    console.log("  ✗ FAIL:", error.message, "\n");
    return false;
  }
}

// Test 4: POST create video with valid data (should succeed)
async function test4_CreateVideoWithValidData() {
  console.log("Test 4: POST /api/videos with valid data (should succeed)");
  try {
    // Create a simple test image (1x1 PNG)
    const testImage = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );

    const formData = createMultipartFormData(
      {
        title: "Integration Test Video",
        iframeEmbed:
          '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>',
        tags: "test,integration,demo",
      },
      {
        name: "test-thumbnail.png",
        type: "image/png",
        data: testImage,
      },
    );

    const response = await makeRequest(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": formData.contentType,
        "x-admin-key": API_KEY,
      },
      body: formData.body,
    });

    console.log("  Status:", response.statusCode);
    console.log("  Response:", response.body);

    if (response.statusCode === 201) {
      const video = JSON.parse(response.body);
      createdVideoId = video.id;
      console.log("  Created video ID:", createdVideoId);
      console.log("  ✓ PASS: Successfully created video\n");
      return true;
    } else {
      console.log("  ✗ FAIL: Expected status 201\n");
      return false;
    }
  } catch (error) {
    console.log("  ✗ FAIL:", error.message, "\n");
    return false;
  }
}

// Test 5: GET video by ID (should retrieve the created video)
async function test5_GetVideoById() {
  console.log("Test 5: GET /api/videos/:id (retrieve created video)");

  if (!createdVideoId) {
    console.log("  ✗ SKIP: No video ID from previous test\n");
    return false;
  }

  try {
    const response = await makeRequest(`${API_URL}/${createdVideoId}`, {
      method: "GET",
    });
    console.log("  Status:", response.statusCode);
    console.log("  Response:", response.body);

    if (response.statusCode === 200) {
      const video = JSON.parse(response.body);
      if (
        video.id === createdVideoId &&
        video.title === "Integration Test Video"
      ) {
        console.log(
          "  ✓ PASS: Successfully retrieved video with correct data\n",
        );
        return true;
      } else {
        console.log("  ✗ FAIL: Video data mismatch\n");
        return false;
      }
    } else {
      console.log("  ✗ FAIL: Expected status 200\n");
      return false;
    }
  } catch (error) {
    console.log("  ✗ FAIL:", error.message, "\n");
    return false;
  }
}

// Test 6: GET video with invalid ID (should return 404)
async function test6_GetVideoWithInvalidId() {
  console.log("Test 6: GET /api/videos/:id with invalid ID (should fail)");
  try {
    const response = await makeRequest(`${API_URL}/invalid_id_12345`, {
      method: "GET",
    });
    console.log("  Status:", response.statusCode);
    console.log("  Response:", response.body);

    if (response.statusCode === 404) {
      console.log("  ✓ PASS: Correctly returned 404 for invalid ID\n");
      return true;
    } else {
      console.log("  ✗ FAIL: Expected status 404\n");
      return false;
    }
  } catch (error) {
    console.log("  ✗ FAIL:", error.message, "\n");
    return false;
  }
}

// Test 7: GET all videos (should include the created video)
async function test7_GetAllVideosWithData() {
  console.log("Test 7: GET /api/videos (should include created video)");
  try {
    const response = await makeRequest(API_URL, { method: "GET" });
    console.log("  Status:", response.statusCode);

    if (response.statusCode === 200) {
      const videos = JSON.parse(response.body);
      console.log("  Found", videos.length, "video(s)");

      if (videos.length > 0 && videos.some((v) => v.id === createdVideoId)) {
        console.log(
          "  ✓ PASS: Successfully retrieved videos including created video\n",
        );
        return true;
      } else {
        console.log("  ✗ FAIL: Created video not found in list\n");
        return false;
      }
    } else {
      console.log("  ✗ FAIL: Expected status 200\n");
      return false;
    }
  } catch (error) {
    console.log("  ✗ FAIL:", error.message, "\n");
    return false;
  }
}

// Test 8: DELETE video without API key (should fail with 401)
async function test8_DeleteVideoWithoutAuth() {
  console.log("Test 8: DELETE /api/videos/:id without API key (should fail)");

  if (!createdVideoId) {
    console.log("  ✗ SKIP: No video ID from previous test\n");
    return false;
  }

  try {
    const response = await makeRequest(`${API_URL}/${createdVideoId}`, {
      method: "DELETE",
    });
    console.log("  Status:", response.statusCode);
    console.log("  Response:", response.body);

    if (response.statusCode === 401) {
      console.log("  ✓ PASS: Correctly rejected unauthorized delete request\n");
      return true;
    } else {
      console.log("  ✗ FAIL: Expected status 401\n");
      return false;
    }
  } catch (error) {
    console.log("  ✗ FAIL:", error.message, "\n");
    return false;
  }
}

// Test 9: DELETE video with API key (should succeed)
async function test9_DeleteVideoWithAuth() {
  console.log("Test 9: DELETE /api/videos/:id with API key (should succeed)");

  if (!createdVideoId) {
    console.log("  ✗ SKIP: No video ID from previous test\n");
    return false;
  }

  try {
    const response = await makeRequest(`${API_URL}/${createdVideoId}`, {
      method: "DELETE",
      headers: {
        "x-admin-key": API_KEY,
      },
    });

    console.log("  Status:", response.statusCode);

    if (response.statusCode === 204) {
      console.log("  ✓ PASS: Successfully deleted video\n");
      return true;
    } else {
      console.log("  ✗ FAIL: Expected status 204\n");
      return false;
    }
  } catch (error) {
    console.log("  ✗ FAIL:", error.message, "\n");
    return false;
  }
}

// Test 10: GET deleted video (should return 404)
async function test10_GetDeletedVideo() {
  console.log("Test 10: GET /api/videos/:id for deleted video (should fail)");

  if (!createdVideoId) {
    console.log("  ✗ SKIP: No video ID from previous test\n");
    return false;
  }

  try {
    const response = await makeRequest(`${API_URL}/${createdVideoId}`, {
      method: "GET",
    });
    console.log("  Status:", response.statusCode);

    if (response.statusCode === 404) {
      console.log("  ✓ PASS: Correctly returned 404 for deleted video\n");
      return true;
    } else {
      console.log("  ✗ FAIL: Expected status 404\n");
      return false;
    }
  } catch (error) {
    console.log("  ✗ FAIL:", error.message, "\n");
    return false;
  }
}

// Test 11: Verify CORS headers
async function test11_VerifyCorsHeaders() {
  console.log("Test 11: Verify CORS headers are present");
  try {
    const response = await makeRequest(API_URL, { method: "GET" });
    console.log("  Status:", response.statusCode);
    console.log(
      "  CORS Header:",
      response.headers["access-control-allow-origin"],
    );

    if (response.headers["access-control-allow-origin"]) {
      console.log("  ✓ PASS: CORS headers present\n");
      return true;
    } else {
      console.log("  ✗ FAIL: CORS headers missing\n");
      return false;
    }
  } catch (error) {
    console.log("  ✗ FAIL:", error.message, "\n");
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = [];

  results.push(await test1_GetAllVideos());
  results.push(await test2_CreateVideoWithoutAuth());
  results.push(await test3_CreateVideoWithInvalidData());
  results.push(await test4_CreateVideoWithValidData());
  results.push(await test5_GetVideoById());
  results.push(await test6_GetVideoWithInvalidId());
  results.push(await test7_GetAllVideosWithData());
  results.push(await test8_DeleteVideoWithoutAuth());
  results.push(await test9_DeleteVideoWithAuth());
  results.push(await test10_GetDeletedVideo());
  results.push(await test11_VerifyCorsHeaders());

  const passed = results.filter((r) => r).length;
  const total = results.length;

  console.log("=== Test Summary ===");
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log("\n✓ All integration tests passed!");
    process.exit(0);
  } else {
    console.log("\n✗ Some tests failed");
    process.exit(1);
  }
}

// Start tests
runAllTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

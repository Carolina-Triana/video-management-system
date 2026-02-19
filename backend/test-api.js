// Quick API test script
const http = require("http");

// Test GET /api/videos
console.log("Testing GET /api/videos...");
http
  .get("http://localhost:3000/api/videos", (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      console.log("Status:", res.statusCode);
      console.log("Response:", data);
    });
  })
  .on("error", (err) => {
    console.error("Error:", err.message);
  });

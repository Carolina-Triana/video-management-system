# Manual Testing Guide - Task 12 Final Checkpoint

## Overview

This guide walks you through manually testing the complete video management system integration.

## Prerequisites

- Backend server running on http://localhost:3000
- Supabase storage RLS policies configured (see SUPABASE_STORAGE_FIX.md)
- Modern web browser (Chrome, Firefox, Edge, Safari)

## Test 1: Backend Server Health Check

### Steps:

1. Open a terminal
2. Run: `curl http://localhost:3000/api/videos`
   - Or open http://localhost:3000/api/videos in your browser

### Expected Result:

- Status: 200 OK
- Response: `[]` (empty array if no videos exist)

### Actual Result:

✓ PASS - Server is running and responding correctly

---

## Test 2: Admin Interface - Open and Inspect

### Steps:

1. Navigate to the `admin` directory
2. Open `index.html` in your web browser
   - **Option A**: Double-click the file
   - **Option B**: Right-click > Open with > Browser
   - **Option C**: Drag and drop into browser window

3. Open Browser DevTools:
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)

4. Go to the **Console** tab

### Expected Result:

- Dark purple gradient background
- Glassmorphism form panel with white/transparent styling
- Form fields visible: Title, Tags, Iframe Embed, Thumbnail
- "Create Video" button at bottom
- No console errors

### Visual Checklist:

- [ ] Background gradient (gray-900 to purple-900)
- [ ] Form panel has blur effect and transparency
- [ ] All input fields are visible and styled
- [ ] File upload button is styled
- [ ] Submit button has purple-to-pink gradient
- [ ] Responsive layout (try resizing browser)

---

## Test 3: Console Logging - Submit Attempt

### Steps:

1. With DevTools Console open
2. Fill in the form with ANY values (even invalid ones)
3. Click "Create Video" button

### Expected Result:

Console should immediately show:

```
admin_submit_attempt
```

### Verification:

- [ ] Log appears immediately when button is clicked
- [ ] Log appears BEFORE any network request

---

## Test 4: Error Case - Missing API Key

### Steps:

1. Open `admin/app.js` in a text editor
2. Temporarily change the API key to an invalid value:
   ```javascript
   apiKey: "invalid-key-for-testing";
   ```
3. Save the file
4. Refresh the browser page
5. Fill in the form with valid data:
   - Title: "Test Video"
   - Tags: "test, demo"
   - Iframe: `<iframe src="https://www.youtube.com/embed/test"></iframe>`
   - Thumbnail: Upload any image
6. Submit the form

### Expected Result:

Console should show:

```
admin_submit_attempt
admin_submit_error { error: 'Unauthorized: Missing or invalid admin API key' }
```

UI should show:

- Red error message box
- Error text: "Error: Unauthorized: Missing or invalid admin API key"

### Verification:

- [ ] `admin_submit_attempt` logged
- [ ] `admin_submit_error` logged with error message
- [ ] Error message displayed in UI
- [ ] Error box has red styling
- [ ] Submit button re-enabled after error

**Don't forget to restore the correct API key in app.js after this test!**

---

## Test 5: Validation Error - Title Too Short

### Steps:

1. Ensure API key is correct in `admin/app.js`
2. Fill in the form:
   - Title: "ab" (only 2 characters)
   - Tags: "test"
   - Iframe: `<iframe src="https://www.youtube.com/embed/test"></iframe>`
   - Thumbnail: Upload any image
3. Submit the form

### Expected Result:

Console should show:

```
admin_submit_attempt
admin_submit_error { error: 'Title must be at least 3 characters long' }
```

UI should show:

- Red error message box
- Error text about title length

### Verification:

- [ ] Browser validation may prevent submission (HTML5 minlength)
- [ ] If it reaches API, error message is displayed
- [ ] Console logs are correct

---

## Test 6: Validation Error - Missing Thumbnail

### Steps:

1. Fill in the form:
   - Title: "Test Video"
   - Tags: "test"
   - Iframe: `<iframe src="https://www.youtube.com/embed/test"></iframe>`
   - Thumbnail: **DO NOT upload a file**
2. Submit the form

### Expected Result:

- Browser should prevent submission (HTML5 required attribute)
- OR if it reaches API: Error message about missing thumbnail

### Verification:

- [ ] HTML5 validation works
- [ ] Form cannot be submitted without thumbnail

---

## Test 7: Validation Error - Invalid Iframe

### Steps:

1. Fill in the form:
   - Title: "Test Video"
   - Tags: "test"
   - Iframe: `<div>Not an iframe</div>` (invalid)
   - Thumbnail: Upload any image
2. Submit the form

### Expected Result:

Console should show:

```
admin_submit_attempt
admin_submit_error { error: 'iframeEmbed must contain <iframe and src= attributes' }
```

### Verification:

- [ ] Error message displayed
- [ ] Console logs are correct

---

## Test 8: Success Case - Create Video (Requires RLS Fix)

**Note**: This test will only work after Supabase storage RLS policies are configured.

### Steps:

1. Ensure Supabase storage policies are configured (see SUPABASE_STORAGE_FIX.md)
2. Fill in the form with valid data:
   - Title: "Integration Test Video"
   - Tags: "test, demo, integration"
   - Iframe: `<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315"></iframe>`
   - Thumbnail: Upload a real image file (JPG or PNG)
3. Submit the form

### Expected Result:

Console should show:

```
admin_submit_attempt
admin_submit_success { videoId: 'v_XXXXXXXX' }
```

UI should show:

- Green success message box
- Success text: "Video created successfully! ID: v_XXXXXXXX"
- Form fields are cleared
- Message disappears after 5 seconds

### Verification:

- [ ] `admin_submit_attempt` logged
- [ ] `admin_submit_success` logged with video ID
- [ ] Video ID format: `v_` followed by 8 alphanumeric characters
- [ ] Success message displayed in green
- [ ] Form is cleared after success
- [ ] Message auto-hides after 5 seconds

---

## Test 9: Verify Video in Database

### Steps:

1. After creating a video in Test 8
2. Open Supabase Dashboard
3. Go to **Database** > **Table Editor**
4. Select `videos` table

### Expected Result:

- New row with the created video
- All fields populated:
  - `id`: v_XXXXXXXX format
  - `title`: "Integration Test Video"
  - `thumbnail_url`: Full Supabase storage URL
  - `iframe_embed`: The iframe HTML
  - `tags`: ["test", "demo", "integration"]
  - `created_at`: Current timestamp

### Verification:

- [ ] Video record exists in database
- [ ] All fields are correct
- [ ] Timestamp is recent

---

## Test 10: Verify Thumbnail in Storage

### Steps:

1. Open Supabase Dashboard
2. Go to **Storage** > **thumbnails** bucket
3. Look for the uploaded file

### Expected Result:

- File exists with name format: `v_XXXXXXXX_timestamp.ext`
- File is accessible (can preview/download)

### Verification:

- [ ] Thumbnail file exists
- [ ] Filename format is correct
- [ ] File is accessible

---

## Test 11: Retrieve Video via API

### Steps:

1. Copy the video ID from Test 8 (e.g., `v_abc12345`)
2. Run: `curl http://localhost:3000/api/videos/v_abc12345`
   - Or open in browser: http://localhost:3000/api/videos/v_abc12345

### Expected Result:

```json
{
  "id": "v_abc12345",
  "title": "Integration Test Video",
  "thumbnailUrl": "https://...supabase.co/storage/v1/object/public/thumbnails/...",
  "iframeEmbed": "<iframe src=\"https://www.youtube.com/embed/dQw4w9WgXcQ\" width=\"560\" height=\"315\"></iframe>",
  "tags": ["test", "demo", "integration"],
  "createdAt": "2024-..."
}
```

### Verification:

- [ ] Video data returned correctly
- [ ] All fields match what was submitted
- [ ] Thumbnail URL is accessible

---

## Test 12: Delete Video via API

### Steps:

1. Copy the video ID from Test 8
2. Run:
   ```bash
   curl -X DELETE http://localhost:3000/api/videos/v_abc12345 \
     -H "x-admin-key: sb_publishable_TZ1KMuVU9YFdq0ciQNLn4Q_ZkqCaI7-"
   ```

### Expected Result:

- Status: 204 No Content
- Empty response body

### Verification:

- [ ] Delete request succeeds
- [ ] Video no longer in database
- [ ] Thumbnail removed from storage (or deletion attempted)

---

## Test 13: Verify Video Deleted

### Steps:

1. Try to retrieve the deleted video:
   ```bash
   curl http://localhost:3000/api/videos/v_abc12345
   ```

### Expected Result:

```json
{
  "error": "Video not found"
}
```

Status: 404 Not Found

### Verification:

- [ ] 404 error returned
- [ ] Video not in database
- [ ] Thumbnail not in storage

---

## Test Summary Checklist

### Backend Tests

- [x] Server running on port 3000
- [x] GET /api/videos returns 200
- [x] GET with invalid ID returns 404
- [x] POST without API key returns 401
- [x] POST with invalid data returns 400
- [ ] POST with valid data creates video (needs RLS fix)
- [ ] DELETE with API key deletes video (needs RLS fix)

### Admin Interface Tests

- [ ] UI renders correctly with dark theme
- [ ] Form fields are styled with glassmorphism
- [ ] Console logs `admin_submit_attempt` on submit
- [ ] Console logs `admin_submit_error` on error
- [ ] Console logs `admin_submit_success` on success
- [ ] Error messages display in red
- [ ] Success messages display in green
- [ ] Form clears after success
- [ ] Success message auto-hides after 5 seconds

### Integration Tests

- [ ] Video created successfully
- [ ] Video appears in database
- [ ] Thumbnail uploaded to storage
- [ ] Video retrievable via API
- [ ] Video deletable via API
- [ ] Deleted video returns 404

---

## Troubleshooting

### Issue: Storage upload fails

**Solution**: Configure Supabase storage RLS policies (see SUPABASE_STORAGE_FIX.md)

### Issue: CORS error in browser

**Solution**: Ensure backend server is running and CORS_ORIGIN=\* in .env

### Issue: Admin interface doesn't load

**Solution**: Check browser console for errors, ensure app.js is in same directory

### Issue: Console logs don't appear

**Solution**: Ensure DevTools Console tab is open before submitting form

### Issue: Form validation prevents submission

**Solution**: This is expected - fill in all required fields with valid data

---

## Conclusion

After completing all tests:

- All backend functionality should be working
- Admin interface should be fully functional
- Console logging should work correctly
- Complete flow (create, retrieve, delete) should work

If any tests fail, refer to the troubleshooting section or the detailed error messages in the console.

# Phase 1 Task 4 - Avatar Upload

## Overview

Phase 1 Task 4 implements file upload functionality for user avatars. This feature allows authenticated users to upload profile pictures using multipart form data and multer middleware. Uploaded files are stored on the server and can be accessed via a static URL.

---

## Architecture

### File Upload Flow

```
User (Postman/Client)
    ↓
PATCH /api/profile/avatar (multipart/form-data)
    ↓
upload.single("avatar") [multer middleware]
    ↓
validateFile (size, type, mimetype)
    ↓
Save to uploads/avatars/
    ↓
updateAvatar Controller
    ↓
Update User.avatar in MongoDB
    ↓
Return User object with avatar path
    ↓
Static file served at /uploads/{path}
```

---

## Setup Steps

### Step 1: Install Dependencies

```bash
npm install multer
```

### Step 2: Create Upload Middleware

**Location:** `src/middleware/upload.middleware.js`

```javascript
import multer from "multer";
import path from "path";

// Configure diskStorage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars/"); // Directory to save files
  },
  filename: (req, file, cb) => {
    const userId = req.user._id;
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Create upload.single("avatar")
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."));
    }
  },
});

export { upload };
```

### Step 3: Create Profile Controller

**Location:** `src/controllers/profile.controller.js`

```javascript
import User from "../models/User.js";
import { upload } from "../middleware/upload.middleware.js";

const updateAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    const avatarPath = req.file?.path; // Get the file path from multer

    if (!avatarPath) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Update user avatar in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarPath },
      { new: true },
    ).select("-password");

    res.status(200).json({
      message: "Avatar updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ message: "Error updating avatar", error });
  }
};

export { updateAvatar };
```

### Step 4: Create Profile Routes

**Location:** `src/routes/profile.routes.js`

```javascript
import express from "express";
import { updateAvatar } from "../controllers/profile.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

// PATCH /api/profile/avatar - Update user avatar
router.patch(
  "/avatar",
  authenticateUser,
  upload.single("avatar"),
  updateAvatar,
);

export default router;
```

### Step 5: Register Routes in app.js

```javascript
import profileRoutes from "./routes/profile.routes.js";

// Middleware to serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Use the profile routes
app.use("/api/profile", profileRoutes);
```

### Step 6: Update User Model

Add avatar field to User schema:

```javascript
avatar: {
  type: String,
  default: null,
  description: "Path to user's avatar image",
},
```

### Step 7: Create Upload Directory

```bash
mkdir -p uploads/avatars
```

### Step 8: Add to .gitignore

```
uploads/
uploads/avatars/
```

---

## Configuration Details

### Multer Storage Options

| Option | Value | Description |
|--------|-------|-------------|
| **destination** | `uploads/avatars/` | Where files are saved on server |
| **filename** | `{userId}-{timestamp}-{random}.{ext}` | Unique filename pattern |
| **fileSize limit** | 5MB | Maximum file size allowed |
| **allowedMimes** | JPEG, PNG, GIF, WebP | Accepted image types |

### Filename Pattern

```
Format: {userId}-{timestamp}-{randomNumber}.{extension}

Example: 507f1f77bcf86cd799439011-1784727468739-782001075.png
         └─ User ID ─┘  └─ Timestamp ─┘  └─ Random ─┘  └─ Ext ─┘
```

**Benefits:**
- ✅ Unique per user and upload
- ✅ No filename collisions
- ✅ Preserves original extension
- ✅ Sorted chronologically in directory

---

## API Endpoint

### PATCH /api/profile/avatar

**Purpose:** Update user's avatar image

**Authentication:** Required (JWT token in cookie)

**Content-Type:** multipart/form-data

**Request Body:**
```
Key: avatar
Value: [File] (image file)
```

**Success Response (200):**
```json
{
  "message": "Avatar updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "employee",
    "avatar": "uploads/avatars/507f1f77bcf86cd799439011-1784727468739-782001075.png",
    "createdAt": "2026-07-20T10:00:00.000Z",
    "updatedAt": "2026-07-22T15:30:45.000Z"
  }
}
```

**Error Responses:**

| Status | Message | Cause |
|--------|---------|-------|
| 400 | No file uploaded | No file provided in request |
| 400 | Invalid file type | File is not JPEG, PNG, GIF, or WebP |
| 400 | File too large | File exceeds 5MB limit |
| 401 | Unauthorized | Missing or invalid JWT token |
| 500 | Error updating avatar | Server error during processing |

---

## Testing Guide

### Using Postman

#### Setup

1. **Get authentication token:**
   ```bash
   POST http://localhost:3000/api/auth/login
   
   Body (JSON):
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

2. **Copy token** from response or cookies

#### Test Avatar Upload

1. **Create new request:**
   - Method: `PATCH`
   - URL: `http://localhost:3000/api/profile/avatar`

2. **Add Authorization:**
   - Tab: `Authorization`
   - Type: `Bearer Token`
   - Token: `[paste_your_token_here]`

3. **Add File:**
   - Tab: `Body`
   - Select: `form-data`
   - Key: `avatar`
   - Value: Select file (image)

4. **Send Request** and verify success response

### Using cURL

```bash
# Set your token variable
TOKEN="your_jwt_token_here"

# Upload avatar
curl -X PATCH http://localhost:3000/api/profile/avatar \
  -H "Cookie: token=$TOKEN" \
  -F "avatar=@/path/to/image.png"
```

### Using curl with Bearer Token

```bash
curl -X PATCH http://localhost:3000/api/profile/avatar \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@/path/to/image.png"
```

---

## Test Scenarios

### Scenario 1: Valid Avatar Upload

**Setup:** Authenticated user with valid image file

**Test:**
```bash
curl -X PATCH http://localhost:3000/api/profile/avatar \
  -H "Cookie: token=valid_token" \
  -F "avatar=@logo.png"
```

**Expected:** ✅ 200 OK with user object including avatar path

---

### Scenario 2: Missing Authentication

**Setup:** No token provided

**Test:**
```bash
curl -X PATCH http://localhost:3000/api/profile/avatar \
  -F "avatar=@logo.png"
```

**Expected:** ❌ 401 Unauthorized

---

### Scenario 3: No File Provided

**Setup:** Authenticated but no file in request

**Test:**
```bash
curl -X PATCH http://localhost:3000/api/profile/avatar \
  -H "Cookie: token=valid_token"
```

**Expected:** ❌ 400 No file uploaded

---

### Scenario 4: Invalid File Type

**Setup:** Upload non-image file

**Test:**
```bash
curl -X PATCH http://localhost:3000/api/profile/avatar \
  -H "Cookie: token=valid_token" \
  -F "avatar=@document.pdf"
```

**Expected:** ❌ 400 Invalid file type

---

### Scenario 5: File Too Large

**Setup:** Upload file larger than 5MB

**Test:**
```bash
curl -X PATCH http://localhost:3000/api/profile/avatar \
  -H "Cookie: token=valid_token" \
  -F "avatar=@huge_image.jpg"
```

**Expected:** ❌ 400 File too large

---

## Access Uploaded Files

### Direct File Access

Once uploaded, files can be accessed at:

```
http://localhost:3000/uploads/avatars/{filename}

Example:
http://localhost:3000/uploads/avatars/507f1f77bcf86cd799439011-1784727468739-782001075.png
```

### In User Profile

Get user profile and display avatar:

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: token=valid_token"
```

Response includes:
```json
{
  "avatar": "uploads/avatars/507f1f77bcf86cd799439011-1784727468739-782001075.png"
}
```

---

## Troubleshooting

### Issue: "ENOENT: no such file or directory"

**Solution:** Create upload directory
```bash
mkdir -p uploads/avatars
```

### Issue: "Invalid file type"

**Solution:** Ensure file is one of: JPEG, PNG, GIF, WebP

**Check file type:**
```bash
file your_image.jpg
```

### Issue: "File too large"

**Solution:** Resize image or increase limit in `upload.middleware.js`
```javascript
limits: { fileSize: 10 * 1024 * 1024 } // 10MB
```

### Issue: Files not served

**Verify app.js has:**
```javascript
app.use("/uploads", express.static("uploads"));
```

### Issue: Token not recognized

**Ensure:**
1. Token is valid (not expired)
2. Token format is correct: `Bearer token_here`
3. Request includes authentication header

---

## File Structure

```
src/
├── controllers/
│   └── profile.controller.js    (updateAvatar function)
├── middleware/
│   └── upload.middleware.js     (multer configuration)
├── routes/
│   └── profile.routes.js        (PATCH /avatar)
└── app.js                        (static file serving)

uploads/                          (created by mkdir)
└── avatars/                      (stores uploaded files)

.gitignore
└── uploads/                      (ignore uploaded files)
```

---

## Security Best Practices

### ✅ Implemented

- **File type validation:** Only images allowed
- **Size limits:** 5MB maximum
- **MIME type checking:** Verified server-side
- **Authentication required:** JWT token validation
- **Unique filenames:** Prevents overwrites and traversal

### ⚠️ Additional Recommendations

1. **Virus scanning:** Add malware detection for production
2. **CDN storage:** Use S3/GCS instead of local storage at scale
3. **Image optimization:** Compress/resize before saving
4. **Access control:** Serve avatars only to authorized users
5. **Rate limiting:** Limit uploads per user per time period

---

## Next Steps

✅ Avatar upload complete!

**Future enhancements:**
- [ ] Delete avatar endpoint
- [ ] Image resizing/thumbnail generation
- [ ] Avatar URL in public profile
- [ ] Batch upload for multiple files
- [ ] Cloud storage integration (AWS S3)

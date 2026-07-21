# Phase 1 Task 2 - Notes API Documentation

## Overview
Phase 1 Task 2 focuses on building a comprehensive notes management system using Node.js, Express, MongoDB, and JWT. This system handles creating, retrieving, updating, and deleting notes with user authentication, note tagging, and note pinning features.

---

## Pagination Implementation

### Overview
The Notes API implements **offset-based pagination** to efficiently handle large datasets. Pagination allows clients to retrieve notes in manageable chunks rather than fetching all notes at once.

### How It Works
1. **Page Number**: Client specifies which page of results to retrieve (starts at 1)
2. **Limit**: Client specifies how many items per page (default: 10)
3. **Skip Calculation**: Server calculates `skip = (page - 1) * limit`
4. **Query Execution**: MongoDB skips the calculated number of documents and returns the limited result set
5. **Metadata**: Response includes pagination info for client-side navigation

### Pagination Formula
```
skip = (page - 1) * limit
totalPages = Math.ceil(total / limit)
hasNextPage = page < totalPages
hasPrevPage = page > 1
```

### Default Values
- `page`: 1 (first page)
- `limit`: 10 (10 items per page)

### Validation
- Both `page` and `limit` must be positive integers (≥ 1)
- Non-positive values will return a 400 Bad Request error

### Response Metadata
Every paginated endpoint includes a `pagination` object with:
- `total`: Total number of notes for the user
- `page`: Current page number
- `limit`: Items per page
- `totalPages`: Total number of available pages
- `hasNextPage`: Boolean indicating if more pages exist
- `hasPrevPage`: Boolean indicating if previous pages exist

### Frontend Integration Example
```javascript
// Fetch page 2 with 15 items per page
async function fetchNotesPage(page = 1, limit = 10) {
  const response = await fetch(`/api/notes?page=${page}&limit=${limit}`, {
    method: 'GET',
    credentials: 'include'
  });
  const data = await response.json();
  
  console.log(`Showing ${data.notes.length} of ${data.pagination.total} notes`);
  console.log(`Page ${data.pagination.page} of ${data.pagination.totalPages}`);
  
  // Use hasNextPage and hasPrevPage for pagination UI
  if (data.pagination.hasNextPage) {
    // Show "Next" button
  }
  if (data.pagination.hasPrevPage) {
    // Show "Previous" button
  }
}
```

---

## API Endpoints

### 1. Create Note
**Endpoint:** `POST /api/notes`

**Description:** Creates a new note for the authenticated user.

**Authentication:** Required (JWT token in cookie or Authorization header)

**Request Body:**
```json
{
  "title": "My First Note",
  "content": "This is the content of my note",
  "tags": ["work", "important"],
  "isPinned": false
}
```

**Response (Success - 201):**
```json
{
  "message": "Note created successfully",
  "note": {
    "_id": "...",
    "title": "My First Note",
    "content": "This is the content of my note",
    "tags": ["work", "important"],
    "isPinned": false,
    "user": "...",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response (Error - 500):**
```json
{
  "message": "Error creating note",
  "error": "..."
}
```

---

### 2. Get All Notes
**Endpoint:** `GET /api/notes`

**Description:** Retrieves all notes belonging to the authenticated user with user details populated. Supports pagination for efficient data retrieval.

**Authentication:** Required (JWT token in cookie or Authorization header)

**Query Parameters:**
- `page` (integer, optional): Page number for pagination. Defaults to `1` if not provided.
- `limit` (integer, optional): Number of notes per page. Defaults to `10` if not provided.

**Pagination Rules:**
- Both `page` and `limit` must be positive integers (≥ 1)
- Invalid pagination parameters return a 400 error

**Response (Success - 200):**
```json
{
  "message": "Notes retrieved successfully",
  "notes": [
    {
      "_id": "note1",
      "title": "My First Note",
      "content": "This is the content of my note",
      "tags": ["work", "important"],
      "isPinned": false,
      "user": {
        "_id": "userId",
        "username": "john_doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Response (Bad Request - 400):**
```json
{
  "message": "Page and limit must be positive integers"
}
```

**Response (Unauthorized - 401):**
```json
{
  "message": "Unauthorized"
}
```

**Usage Examples:**

1. **Fetch first page with default settings:**
   ```
   GET /api/notes
   ```

2. **Fetch second page with 15 items per page:**
   ```
   GET /api/notes?page=2&limit=15
   ```

3. **Fetch third page with 5 items per page:**
   ```
   GET /api/notes?page=3&limit=5
   ```

**Technical Notes:**
- Uses MongoDB `.populate()` to replace the user ID with full user object containing only `username` and `email` fields
- This improves performance by not fetching unnecessary fields like passwords
- Returns only notes belonging to the authenticated user
- Notes are sorted by `createdAt` in descending order (newest first)
- Pagination metadata (`total`, `page`, `limit`, `totalPages`, `hasNextPage`, `hasPrevPage`) is included in every successful response
- Uses MongoDB `.skip()` to exclude documents from the beginning and `.limit()` to specify the number of documents returned

---

### 3. Get Note by ID
**Endpoint:** `GET /api/notes/:id`

**Description:** Retrieves a specific note by its ID for the authenticated user.

**Authentication:** Required (JWT token in cookie or Authorization header)

**Path Parameters:**
- `id` (string, required): The MongoDB ObjectId of the note

**Response (Success - 200):**
```json
{
  "message": "Note retrieved successfully",
  "note": {
    "_id": "note1",
    "title": "My First Note",
    "content": "This is the content of my note",
    "tags": ["work", "important"],
    "isPinned": false,
    "user": {
      "_id": "userId",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response (Not Found - 404):**
```json
{
  "message": "Note not found"
}
```

**Technical Notes:**
- Uses `req.params.id` to extract the note ID from the URL path
- Ensures users can only access their own notes by checking both `_id` and `user` fields
- Returns 404 if note doesn't exist or doesn't belong to the user

---

### 4. Update Note
**Endpoint:** `PATCH /api/notes/:id`

**Description:** Updates a specific note with new title, content, tags, or pin status.

**Authentication:** Required (JWT token in cookie or Authorization header)

**Path Parameters:**
- `id` (string, required): The MongoDB ObjectId of the note

**Request Body (all fields optional):**
```json
{
  "title": "Updated Note Title",
  "content": "Updated content",
  "tags": ["work", "urgent"],
  "isPinned": true
}
```

**Response (Success - 200):**
```json
{
  "message": "Note updated successfully",
  "note": {
    "_id": "note1",
    "title": "Updated Note Title",
    "content": "Updated content",
    "tags": ["work", "urgent"],
    "isPinned": true,
    "user": {
      "_id": "userId",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
}
```

**Response (Not Found - 404):**
```json
{
  "message": "Note not found"
}
```

**Technical Notes:**
- Only updates fields that are provided in the request body
- Uses conditional logic to preserve existing values if fields are not provided
- For `isPinned`, uses strict comparison (`!== undefined`) to allow updating to false
- Ensures users can only update their own notes

---

### 5. Delete Note
**Endpoint:** `DELETE /api/notes/:id`

**Description:** Deletes a specific note for the authenticated user.

**Authentication:** Required (JWT token in cookie or Authorization header)

**Path Parameters:**
- `id` (string, required): The MongoDB ObjectId of the note

**Response (Success - 200):**
```json
{
  "message": "Note deleted successfully"
}
```

**Response (Not Found - 404):**
```json
{
  "message": "Note not found"
}
```

**Technical Notes:**
- Uses `findOneAndDelete()` to find and delete in a single operation
- Ensures users can only delete their own notes by checking both `_id` and `user` fields
- Returns 404 if note doesn't exist or doesn't belong to the user

---

## Authentication

### JWT Token
- All endpoints (except potentially logout) require a valid JWT token
- Tokens are extracted from cookies or the `Authorization` header with Bearer scheme
- Authentication is enforced via the `authenticateUser` middleware

---

## Data Model

### Note Schema
```javascript
{
  title: String (required),
  content: String (required),
  tags: [String] (optional),
  isPinned: Boolean (default: false),
  user: ObjectId (reference to User model),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## Security Features

1. **User Isolation**: Each user can only access, update, or delete their own notes
2. **Authentication Required**: All endpoints require valid JWT authentication
3. **Data Validation**: Request bodies are validated before database operations
4. **Error Handling**: Consistent error responses with appropriate HTTP status codes

---

## Testing Guide

### Using cURL

**Create a Note:**
```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "My First Note",
    "content": "This is the content",
    "tags": ["work"],
    "isPinned": false
  }'
```

**Get All Notes:**
```bash
curl -X GET http://localhost:3000/api/notes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Note by ID:**
```bash
curl -X GET http://localhost:3000/api/notes/NOTE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Update a Note:**
```bash
curl -X PATCH http://localhost:3000/api/notes/NOTE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Updated Title",
    "isPinned": true
  }'
```

**Delete a Note:**
```bash
curl -X DELETE http://localhost:3000/api/notes/NOTE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman

1. Set up authentication in the Authorization tab
2. Import the endpoints or create new requests
3. Use the above request/response examples as reference
4. Test both success and error cases (unauthorized access, non-existent notes, etc.)

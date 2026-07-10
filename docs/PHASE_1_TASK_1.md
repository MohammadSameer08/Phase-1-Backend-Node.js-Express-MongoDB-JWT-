# Phase 1 Task 1 - Authentication API Documentation

## Overview
Phase 1 Task 1 focuses on building a comprehensive authentication system using Node.js, Express, MongoDB, and JWT. This system handles user registration, login, logout, password management, and profile updates with secure JWT token-based authentication.

---

## API Endpoints

### 1. Register User
**Endpoint:** `POST /api/auth/register`

**Description:** Creates a new user account with username, email, and password.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (Success - 201):**
```json
{
  "message": "User registered successfully"
}
```
Cookie set: `token` (httpOnly cookie containing JWT access token)

**Response (Error - 500):**
```json
{
  "message": "Error registering user",
  "error": "..."
}
```

---

### 2. Login User
**Endpoint:** `POST /api/auth/login`

**Description:** Authenticates a user and returns a JWT token via secure cookie.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (Success - 200):**
```json
{
  "message": "User logged in successfully",
  "user": {
    "_id": "...",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```
Cookie set: `token` (httpOnly cookie containing JWT access token)

**Response (User Not Found - 404):**
```json
{
  "message": "User not found"
}
```

**Response (Invalid Password - 401):**
```json
{
  "message": "Invalid password"
}
```

---

### 3. Get Current User
**Endpoint:** `GET /api/auth/me`

**Description:** Retrieves the profile of the authenticated user.

**Authentication:** Required (JWT token in cookie or Authorization header)

**Response (Success - 200):**
```json
{
  "user": {
    "_id": "...",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "message": "Current user fetched successfully"
}
```

**Response (Unauthorized - 401):**
```json
{
  "message": "Unauthorized"
}
```

---

### 4. Logout User
**Endpoint:** `POST /api/auth/logout`

**Description:** Logs out the user by clearing the authentication token cookie.

**Authentication:** Not required

**Response (Success - 200):**
```json
{
  "message": "User logged out successfully"
}
```

---

### 5. Update Password
**Endpoint:** `PATCH /api/auth/update-password`

**Description:** Updates the user's password after verifying the current password.

**Authentication:** Required (JWT token in cookie or Authorization header)

**Request Body:**
```json
{
  "currentPassword": "securePassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response (Success - 200):**
```json
{
  "message": "Password updated successfully"
}
```

**Response (User Not Found - 404):**
```json
{
  "message": "User not found"
}
```

**Response (Invalid Current Password - 401):**
```json
{
  "message": "Invalid current password"
}
```

**Technical Notes:**
- The password field is hidden by default in the User model (`select: false`)
- The function explicitly fetches the password using `.select("+password")` for verification
- Uses bcrypt for secure password comparison and hashing
- The new password is hashed with salt rounds of 10 before saving

---

### 6. Update Profile
**Endpoint:** `PATCH /api/auth/profile`

**Description:** Updates the user's profile information.

**Authentication:** Required (JWT token in cookie or Authorization header)

**Request Body:**
```json
{
  "username": "new_username",
  "email": "newemail@example.com"
}
```

**Response (Success - 200):**
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

## Authentication

### JWT Token
- Tokens are generated using the `generateAccessToken()` method on the User model
- Tokens are stored in an `httpOnly` cookie for security (prevents XSS attacks)
- Token validation happens in the `authenticateUser` middleware

### Authorization Flow
1. User registers or logs in
2. Server generates a JWT token
3. Token is sent as an `httpOnly` cookie
4. Middleware verifies token on protected routes
5. User object is attached to `req.user` for use in controllers

### Middleware: `authenticateUser`
- Retrieves token from cookies or Authorization header
- Verifies token signature using `JWT_SECRET` environment variable
- Fetches user from database and attaches to `req.user`
- Returns 401 Unauthorized if token is invalid or user not found

---

## Security Features

✅ **Password Hashing:** Uses bcrypt with salt rounds of 10  
✅ **JWT Authentication:** Secure token-based authentication  
✅ **HttpOnly Cookies:** Tokens stored securely in httpOnly cookies  
✅ **Password Field Protection:** Password field excluded from queries by default  
✅ **Password Verification:** Current password validated before updating  

---

## Error Handling

All endpoints include proper error handling with:
- Appropriate HTTP status codes
- Descriptive error messages
- Server logs for debugging (especially in updatePassword)

---

## Environment Variables Required

```
JWT_SECRET=your_jwt_secret_key
MONGODB_URI=your_mongodb_connection_string
```

---

## Testing the APIs

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Get Current User (with token in cookie):**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

**Update Password:**
```bash
curl -X PATCH http://localhost:3000/api/auth/update-password \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{"currentPassword":"password123","newPassword":"newpassword456"}'
```

---

## Technology Stack

| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | Database |
| JWT | Authentication tokens |
| bcrypt | Password hashing |
| Mongoose | MongoDB ODM |

---

## Summary

Phase 1 Task 1 provides a complete authentication system with user registration, secure login, password management, and profile updates. All passwords are securely hashed using bcrypt, tokens are managed via JWT, and sensitive data is protected from unauthorized access.

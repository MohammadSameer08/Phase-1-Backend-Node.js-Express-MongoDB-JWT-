# Phase 1 Task 3 - Role-Based Authorization

## Overview
Phase 1 Task 3 focuses on implementing role-based access control (RBAC) in the Notes API. This system ensures that only users with specific roles can access certain endpoints, adding an extra layer of security to your application.

---

### `authorizeRole` Middleware

The `authorizeRole` middleware is a **higher-order function** that checks if a user has the required role to access a protected endpoint.

**Location:** `src/middleware/authorizeRole.middleware.js`

#### Function Signature
```javascript
// Accepts multiple roles (variadic arguments)
const authorizeRole = (...requiredRoles) => async (req, res, next) => {
  // Checks if user role matches any of the required roles
};
```

#### How It Works
1. **Accepts multiple roles**: Takes any number of roles as arguments using rest parameters (`...requiredRoles`)
2. **Returns middleware**: Returns an async middleware function with `(req, res, next)`
3. **Compares roles**: Converts all roles to lowercase and checks if user's role is in the allowed list
4. **Grants/Denies access**: 
   - If user role is in allowed roles: Calls `next()` to proceed
   - If user role is not allowed: Returns 403 Forbidden error

#### Features
- **Multiple role support**: Single endpoint can require multiple roles
- **Case-insensitive**: All comparisons are lowercase
- **Variadic syntax**: `authorizeRole("admin")` or `authorizeRole("admin", "manager")`
- **Flexible**: Can be used with any custom roles

---

## User Roles

The application supports three default roles defined in the User schema:

| Role | Description | Permissions |
|------|-------------|------------|
| `employee` | Regular user | Can create/read/update/delete own notes |
| `admin` | Administrator | Can delete users, access admin endpoints |
| `manager` | Manager | Can moderate and manage lower-level users |

New roles can be added by updating the `enum` in the User schema:
```javascript
role: {
  type: String,
  enum: ["employee", "admin", "manager"], // Add new roles here
  default: "employee",
}
```

---

## Route Structure

The application separates routes into **auth routes** (authentication) and **user routes** (user management). This keeps each file focused and maintainable as the project grows.

### File Organization

```
src/
├── routes/
│   ├── auth.routes.js       # Authentication endpoints
│   ├── user.routes.js       # User management endpoints (admin)
│   └── note.route.js        # Note management endpoints
├── controllers/
│   ├── auth.controller.js   # Auth logic (register, login, etc.)
│   ├── user.controller.js   # User management logic
│   └── note.controller.js   # Note logic
└── middleware/
    ├── auth.middleware.js           # Authentication middleware
    └── authorizeRole.middleware.js  # Authorization middleware
```

### app.js Route Registration

```javascript
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import noteRoutes from "./routes/note.route.js";

app.use("/api/auth", authRoutes);   // Authentication routes
app.use("/api", userRoutes);        // User management routes
app.use("/api/notes", noteRoutes);  // Note routes
```

---

## Authentication Routes (auth.routes.js)

Public and protected authentication endpoints:

| Method | Endpoint | Auth | Description |
|--------|----------|------|------------|
| POST | `/api/auth/register` | ❌ No | Self-register as employee |
| POST | `/api/auth/login` | ❌ No | Login with email/password |
| POST | `/api/auth/logout` | ✅ Yes | Logout (clear token) |
| GET | `/api/auth/me` | ✅ Yes | Get current user profile |
| PATCH | `/api/auth/profile` | ✅ Yes | Update profile (username) |
| PATCH | `/api/auth/update-password` | ✅ Yes | Update password |

### Example Requests

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secure123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure123"
  }'

# Get Current User
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update Profile
curl -X PATCH http://localhost:3000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{ "username": "john_updated" }'

# Update Password
curl -X PATCH http://localhost:3000/api/auth/update-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "currentPassword": "secure123",
    "newPassword": "newSecure456"
  }'
```

---

## User Management Routes (user.routes.js)

Admin-only endpoints for managing users:

| Method | Endpoint | Auth | Role Required | Description |
|--------|----------|------|---------------|------------|
| GET | `/api/users` | ✅ Yes | Admin, Manager | Get all users |
| POST | `/api/users` | ✅ Yes | Admin | Create new user with role |
| GET | `/api/users/:id` | ✅ Yes | Admin, Manager | Get user by ID |
| PATCH | `/api/users/:id` | ✅ Yes | Admin | Update user details |
| DELETE | `/api/users/:id` | ✅ Yes | Admin | Delete user |
| PATCH | `/api/users/:id/role` | ✅ Yes | Admin | Update user role |

### Example Requests

```bash
# Get All Users (admin/manager)
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Create User (admin only)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "username": "rahul",
    "email": "rahul@company.com",
    "password": "temp123",
    "role": "manager"
  }'

# Get User by ID (admin/manager)
curl -X GET http://localhost:3000/api/users/6a5fa3107242dab990588029a \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Update User (admin only)
curl -X PATCH http://localhost:3000/api/users/6a5fa3107242dab990588029a \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "username": "rahul_updated",
    "email": "rahul.updated@company.com"
  }'

# Delete User (admin only)
curl -X DELETE http://localhost:3000/api/users/6a5fa3107242dab990588029a \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Update User Role (admin only)
curl -X PATCH http://localhost:3000/api/users/6a5fa3107242dab990588029a/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{ "role": "admin" }'
```

---

## Authorization Middleware
router.delete(
  "/delete/:id",
  authenticateUser,           // 1st: Verify user is logged in
  authorizeRole("admin"),     // 2nd: Verify user has admin role
  deleteUserById              // 3rd: Execute controller if authorized
);
```

---

## Usage in Routes

### In auth.routes.js
```javascript
import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { registerUser, loginUser, logoutUser, getCurrentUser, updateProfile, updatePassword } from "../controllers/auth.controller.js";

const router = Router();

// Public routes (no auth)
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes (auth required)
router.post("/logout", authenticateUser, logoutUser);
router.get("/me", authenticateUser, getCurrentUser);
router.patch("/profile", authenticateUser, updateProfile);
router.patch("/update-password", authenticateUser, updatePassword);

export default router;
```

### In user.routes.js
```javascript
import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";
import authorizeRole from "../middleware/authorizeRole.middleware.js";
import { enumRoles } from "../utils/permissions.utils.js";
import { getAllUsers, createUserByAdmin, getUserById, updateUserById, deleteUserById } from "../controllers/user.controller.js";

const router = Router();

// Get all users (admin/manager)
router.get("/users", 
  authenticateUser, 
  authorizeRole(enumRoles.ADMIN, enumRoles.MANAGER), 
  getAllUsers
);

// Create user (admin only)
router.post("/users", 
  authenticateUser, 
  authorizeRole(enumRoles.ADMIN), 
  createUserByAdmin
);

// Get, update, delete user (admin + manager for read)
router.get("/users/:id", 
  authenticateUser, 
  authorizeRole(enumRoles.ADMIN, enumRoles.MANAGER), 
  getUserById
);

router.patch("/users/:id", 
  authenticateUser, 
  authorizeRole(enumRoles.ADMIN), 
  updateUserById
);

router.delete("/users/:id", 
  authenticateUser, 
  authorizeRole(enumRoles.ADMIN), 
  deleteUserById
);

export default router;
```

### Middleware Chain
The order of middleware matters:

```javascript
router.get(
  "/users",
  authenticateUser,                           // 1st: Verify user is logged in
  authorizeRole("admin", "manager"),          // 2nd: Verify user has required role
  getAllUsers                                 // 3rd: Execute controller if authorized
);
```

---

## API Endpoints with Authorization

### Admin-Only Endpoints

#### Create User (Admin)
**Endpoint:** `POST /api/users`

**Authentication:** Required (JWT token)

**Authorization:** Admin role required

**Request Body:**
```json
{
  "username": "rahul",
  "email": "rahul@company.com",
  "password": "temp123",
  "role": "manager"
}
```

**Response (Success - 201):**
```json
{
  "message": "User created successfully by admin",
  "user": {
    "username": "rahul",
    "email": "rahul@company.com",
    "role": "manager"
  }
}
```

**Response (Forbidden - 403):**
```json
{
  "message": "Forbidden: You do not have the required role to access this resource."
}
```

---

#### Delete User (Admin)
**Endpoint:** `DELETE /api/users/:id`

**Authentication:** Required (JWT token)

**Authorization:** Admin role required

**Path Parameters:**
- `id` (string, required): The MongoDB ObjectId of the user to delete

**Response (Success - 200):**
```json
{
  "message": "User deleted successfully"
}
```

**Response (Forbidden - 403):**
```json
{
  "message": "Forbidden: You do not have the required role to access this resource."
}
```

---

#### Update User (Admin)
**Endpoint:** `PATCH /api/users/:id`

**Authentication:** Required (JWT token)

**Authorization:** Admin role required

**Path Parameters:**
- `id` (string, required): The MongoDB ObjectId of the user

**Request Body (all optional):**
```json
{
  "username": "new_username",
  "email": "newemail@company.com",
  "role": "admin"
}
```

**Response (Success - 200):**
```json
{
  "message": "User updated successfully",
  "user": {
    "_id": "...",
    "username": "new_username",
    "email": "newemail@company.com",
    "role": "admin"
  }
}
```

---

### Admin/Manager Endpoints

#### Get All Users (Admin/Manager)
**Endpoint:** `GET /api/users`

**Authentication:** Required (JWT token)

**Authorization:** Admin or Manager role required

**Response (Success - 200):**
```json
{
  "message": "Users fetched successfully",
  "users": [
    {
      "_id": "...",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "employee"
    },
    {
      "_id": "...",
      "username": "rahul",
      "email": "rahul@company.com",
      "role": "manager"
    }
  ]
}
```

---

#### Get User by ID (Admin/Manager)
**Endpoint:** `GET /api/users/:id`

**Authentication:** Required (JWT token)

**Authorization:** Admin or Manager role required

**Path Parameters:**
- `id` (string, required): The MongoDB ObjectId of the user

**Response (Success - 200):**
```json
{
  "message": "User fetched successfully",
  "user": {
    "_id": "...",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "employee"
  }
}
```

---

## Role Hierarchy

While the system doesn't enforce a strict hierarchy, the recommended pattern is:

```
employee (base level)
    ↓
manager (can supervise employees)
    ↓
admin (full system access)
```

---

## Security Considerations

1. **Always authenticate first**: Authorization checks come after authentication middleware
   ```javascript
   router.post("/admin-route", authenticateUser, authorizeRole("admin"), controller);
   ```

2. **Use constants for roles**: Store role names in a constants file to avoid typos
   ```javascript
   // utils/permissions.utils.js
   export const enumRoles = {
     EMPLOYEE: "employee",
     ADMIN: "admin",
     MANAGER: "manager"
   };
   ```

3. **Case sensitivity**: Role comparison is case-insensitive (e.g., "ADMIN" and "admin" are treated as the same)

4. **Error messages**: Don't reveal if user exists but lacks permissions. Use generic "Forbidden" message

5. **Audit logging**: Consider logging authorization attempts for security audits
   ```javascript
   console.log(`User ${req.user._id} attempted to access ${requiredRole} endpoint`);
   ```

---

## Testing Authorization

### Test Case 1: Admin Can Create and Delete User
```bash
# 1. Register as admin user or use existing admin account
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "sameer",
    "email": "sameer@gmail.com",
    "password": "1234"
  }'

# 2. Login to get admin token (sameer was manually updated to admin role)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sameer@gmail.com",
    "password": "1234"
  }'
# Extract token from response

# 3. Create a new user (admin only)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "username": "rahul",
    "email": "rahul@company.com",
    "password": "temp123",
    "role": "manager"
  }'
# Response: 201 Created - User created successfully by admin

# 4. Delete the user (admin only)
curl -X DELETE http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
# Response: 200 OK - User deleted successfully
```

### Test Case 2: Employee Cannot Create User
```bash
# 1. Register as regular employee
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "email": "john@example.com",
    "password": "password123"
  }'

# 2. Login as employee
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
# Extract token

# 3. Try to create a user (should fail)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer EMPLOYEE_TOKEN" \
  -d '{
    "username": "test",
    "email": "test@company.com",
    "password": "temp123",
    "role": "manager"
  }'
# Response: 403 Forbidden - You do not have the required role
```

### Test Case 3: Manager Can View Users but Cannot Delete
```bash
# 1. Create a manager (admin creates it)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "username": "manager",
    "email": "manager@company.com",
    "password": "mgr123",
    "role": "manager"
  }'

# 2. Login as manager
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@company.com",
    "password": "mgr123"
  }'

# 3. Get all users (manager can do this)
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer MANAGER_TOKEN"
# Response: 200 OK - Users fetched successfully

# 4. Try to delete user (should fail)
curl -X DELETE http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer MANAGER_TOKEN"
# Response: 403 Forbidden - You do not have the required role
```

### Test Case 4: Multi-Role Authorization
```bash
# Both admin and manager can view users
# Admin can read, write, delete
# Manager can only read

# Get users (admin + manager)
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer ADMIN_OR_MANAGER_TOKEN"
# Response: 200 OK

# Create user (admin only)
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Response: 201 Created

# Delete user (admin only)
curl -X DELETE http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Response: 200 OK
```

---

## Implementation Pattern

### Step 1: Separated Route Files
**auth.routes.js** - Authentication routes
```javascript
router.post("/register", registerUser);          // Self-registration
router.post("/login", loginUser);                // Login
router.post("/logout", authenticateUser, logoutUser);
router.get("/me", authenticateUser, getCurrentUser);
router.patch("/profile", authenticateUser, updateProfile);
router.patch("/update-password", authenticateUser, updatePassword);
```

**user.routes.js** - User management routes
```javascript
router.get("/users", authenticateUser, authorizeRole("admin", "manager"), getAllUsers);
router.post("/users", authenticateUser, authorizeRole("admin"), createUserByAdmin);
router.get("/users/:id", authenticateUser, authorizeRole("admin", "manager"), getUserById);
router.patch("/users/:id", authenticateUser, authorizeRole("admin"), updateUserById);
router.delete("/users/:id", authenticateUser, authorizeRole("admin"), deleteUserById);
```

### Step 2: Updated Middleware (Supports Multiple Roles)
```javascript
// src/middleware/authorizeRole.middleware.js
const authorizeRole = (...requiredRoles) => async (req, res, next) => {
  const userRole = req.user.role;
  const allowedRoles = requiredRoles.map((role) => role.toLowerCase());
  if (!allowedRoles.includes(userRole.toLowerCase())) {
    return res.status(403).json({
      message: "Forbidden: You do not have the required role to access this resource.",
    });
  }
  next();
};

export default authorizeRole;
```

### Step 3: User Model with Role Field
```javascript
// src/models/User.js
role: {
  type: String,
  enum: ["employee", "admin", "manager"],
  default: "employee",
}
```

### Step 4: Register Routes in app.js
```javascript
// src/app.js
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
```

---

## Common Patterns

### Multi-Role Endpoint
```javascript
// Both admin and manager can access
router.get("/users", 
  authenticateUser, 
  authorizeRole("admin", "manager"), 
  getAllUsers
);
```

### Single-Role Endpoint
```javascript
// Only admin can access
router.post("/users", 
  authenticateUser, 
  authorizeRole("admin"), 
  createUserByAdmin
);
```

### Role-Based Resource Access (Controller Level)
```javascript
// Only allow users to access their own notes unless they're admin
if (req.user.role !== "admin" && req.user._id !== note.user._id) {
  return res.status(403).json({ message: "Forbidden: Cannot access other users' notes" });
}
```

---

## Troubleshooting

### Issue: Always Getting 403 Forbidden
**Cause:** User role in database doesn't match the required role
**Solution:** Check MongoDB that user role is one of: `employee`, `admin`, `manager` (lowercase)

### Issue: Multi-Role Authorization Not Working
**Cause:** Middleware expecting single role instead of multiple
**Solution:** Use new syntax with variadic arguments:
```javascript
// Correct
authorizeRole("admin", "manager")

// Incorrect (old syntax)
authorizeRole("admin")  // This still works but only allows one role
```

### Issue: Case Sensitivity Problems
**Cause:** Roles stored with different cases (e.g., "Admin" vs "admin")
**Solution:** Middleware converts to lowercase, but ensure database stores lowercase

### Issue: Middleware Chain Not Working
**Cause:** Authentication or authorization middleware is missing
**Solution:** Always ensure correct order:
```javascript
router.get("/endpoint",
  authenticateUser,      // 1st: Authenticate
  authorizeRole("admin"), // 2nd: Authorize
  controller             // 3rd: Execute
);
```


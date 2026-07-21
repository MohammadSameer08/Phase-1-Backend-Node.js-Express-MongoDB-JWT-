# Phase 1 Task 3 - Role-Based Authorization

## Overview
Phase 1 Task 3 focuses on implementing role-based access control (RBAC) in the Notes API. This system ensures that only users with specific roles can access certain endpoints, adding an extra layer of security to your application.

---

## Authorization Middleware

### `authorizeRole` Middleware

The `authorizeRole` middleware is a **higher-order function** that checks if a user has the required role to access a protected endpoint.

**Location:** `src/middleware/authorizeRole.middleware.js`

#### Function Signature
```javascript
const authorizeRole = (requiredRole) => async (req, res, next) => {
  // Checks if user role matches the required role
};
```

#### How It Works
1. **Accepts a parameter**: Takes `requiredRole` as an argument (the role required to access the endpoint)
2. **Returns middleware**: Returns an async middleware function with `(req, res, next)`
3. **Compares roles**: Compares the user's role (`req.user.role`) with the required role (case-insensitive)
4. **Grants/Denies access**: 
   - If roles match: Calls `next()` to proceed to the next middleware/controller
   - If roles don't match: Returns 403 Forbidden error

#### Features
- **Case-insensitive comparison**: Uses `.toLowerCase()` for flexible role matching
- **User isolation**: Relies on authentication middleware to set `req.user`
- **Flexible role checking**: Can be used for any role (admin, manager, moderator, etc.)

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

## Usage Examples

### In Routes

#### Admin-Only Endpoint
```javascript
import authorizeRole from "../middleware/authorizeRole.middleware.js";
import { enumRoles } from "../utils/permissions.utils.js";

// Delete a user (admin only)
router.delete(
  "/delete/:id",
  authenticateUser,
  authorizeRole(enumRoles.ADMIN),
  deleteUserById
);
```

#### Manager-Only Endpoint
```javascript
router.get(
  "/reports",
  authenticateUser,
  authorizeRole(enumRoles.MANAGER),
  getReportsController
);
```

#### Custom Role
```javascript
router.post(
  "/premium-feature",
  authenticateUser,
  authorizeRole("premium"),
  premiumFeatureController
);
```

### Middleware Chain
The authorization check runs **after** authentication:

```javascript
router.delete(
  "/delete/:id",
  authenticateUser,           // 1st: Verify user is logged in
  authorizeRole("admin"),     // 2nd: Verify user has admin role
  deleteUserById              // 3rd: Execute controller if authorized
);
```

---

## API Endpoints with Authorization

### 1. Delete User (Admin Only)
**Endpoint:** `DELETE /api/auth/delete/:id`

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

**Response (Unauthorized - 401):**
```json
{
  "message": "Unauthorized"
}
```

**Usage Example:**
```bash
curl -X DELETE http://localhost:3000/api/auth/delete/6a5fa3107242dab990588029a \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Cookie: token=YOUR_ADMIN_TOKEN"
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

### Test Case 1: Admin Can Delete User
```bash
# Login as admin user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sameer@gmail.com",
    "password": "1234"
  }'

# Extract token from response and use it
curl -X DELETE http://localhost:3000/api/auth/delete/6a5fa3307242dab990588029c \
  -H "Authorization: Bearer YOUR_TOKEN"
  
# Response: 200 OK - User deleted successfully
```

### Test Case 2: Employee Cannot Delete User
```bash
# Login as employee user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aftab@gmail.com",
    "password": "1234"
  }'

# Try to delete with employee token
curl -X DELETE http://localhost:3000/api/auth/delete/6a5fa3107242dab990588029a \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
  
# Response: 403 Forbidden - You do not have the required role
```

### Test Case 3: No Authorization Header
```bash
curl -X DELETE http://localhost:3000/api/auth/delete/6a5fa3107242dab990588029a

# Response: 401 Unauthorized
```

---

## Implementation Pattern

### Step 1: Create the Middleware (Already Done)
```javascript
// src/middleware/authorizeRole.middleware.js
const authorizeRole = (requiredRole) => async (req, res, next) => {
  const userRole = req.user.role;
  console.log("User Role:", userRole);
  if (userRole !== requiredRole.toLowerCase()) {
    return res.status(403).json({
      message: "Forbidden: You do not have the required role to access this resource.",
    });
  }
  next();
};

export default authorizeRole;
```

### Step 2: Apply to Routes
```javascript
// src/routes/auth.routes.js
router.delete(
  "/delete/:id",
  authenticateUser,
  authorizeRole(enumRoles.ADMIN),
  deleteUserById
);
```

### Step 3: Ensure User Model Has Role Field
```javascript
// src/models/User.js
role: {
  type: String,
  enum: ["employee", "admin", "manager"],
  default: "employee",
}
```

### Step 4: Register User with Role
```javascript
// src/controllers/auth.controller.js
const { username, email, password, role } = req.body;
const user = new User({ username, email, password: hashedPassword, role });
```

---

## Common Patterns

### Multi-Role Authorization
To allow multiple roles:
```javascript
const authorizeRoles = (...allowedRoles) => async (req, res, next) => {
  if (!allowedRoles.includes(req.user.role.toLowerCase())) {
    return res.status(403).json({
      message: "Forbidden: Insufficient permissions"
    });
  }
  next();
};

// Usage:
router.post("/moderate", authenticateUser, authorizeRoles("admin", "manager"), moderateController);
```

### Role-Based Resource Access
```javascript
// Only allow users to access their own notes unless admin
if (req.user.role !== "admin" && req.user._id !== note.user._id) {
  return res.status(403).json({ message: "Forbidden" });
}
```

---

## Troubleshooting

### Issue: Always Getting 403 Forbidden
**Cause:** Role in database doesn't match the required role
**Solution:** Check that user role in MongoDB matches the enum values (employee, admin, manager)

### Issue: Role Not Set When Registering
**Cause:** `role` field not extracted from request body
**Solution:** Ensure auth controller includes `role` in destructuring:
```javascript
const { username, email, password, role } = req.body;
```

### Issue: Case Sensitivity Problems
**Cause:** Roles stored in different case (e.g., "Admin" vs "admin")
**Solution:** The middleware uses `.toLowerCase()`, so ensure database values are lowercase


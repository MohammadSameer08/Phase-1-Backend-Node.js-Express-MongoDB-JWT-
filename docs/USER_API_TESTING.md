# User API Testing Guide

Complete testing examples for all user management endpoints in `src/routes/user.routes.js`.

---

## Prerequisites

Before testing, you need:
1. **Admin Token** - From logging in as an admin user
2. **Manager Token** - From logging in as a manager user  
3. **Employee Token** - From logging in as a regular employee (for negative tests)
4. **User IDs** - MongoDB ObjectIds of test users

---

## Step 1: Setup - Create Test Users with Roles

### 1️⃣ Register First Admin User (Self-Registration)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Response:** User created with role `"employee"` by default. Save the email for login.

---

### 2️⃣ Login as Admin and Get Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -b "token=" \
  -c cookies.txt \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Save this token for admin operations:**
```bash
ADMIN_TOKEN="YOUR_ADMIN_TOKEN_FROM_RESPONSE"
```

---

### 3️⃣ Manually Update First User to Admin (One-time only)

Since first user is created as employee, update it to admin in MongoDB:

```bash
# Option A: Using mongosh
mongosh "mongodb://localhost:27017"
use phase1_db
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)

# Option B: Using MongoDB Compass
# Find user → Edit document → Change role: "employee" to "admin" → Save
```

---

### 4️⃣ Create Manager & Employee Users (Using Admin Token)

Now use the admin token to create other test users with their roles:

```bash
# Create Manager User
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$ADMIN_TOKEN" \
  -d '{
    "username": "manager_user",
    "email": "manager@example.com",
    "password": "manager123",
    "role": "manager"
  }'

# Create Employee User  
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$ADMIN_TOKEN" \
  -d '{
    "username": "employee_user",
    "email": "employee@example.com",
    "password": "employee123",
    "role": "employee"
  }'
```

---

### 5️⃣ Login as All Roles and Save Tokens

```bash
# Login as Manager
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@example.com",
    "password": "manager123"
  }'
# Save: MANAGER_TOKEN="YOUR_MANAGER_TOKEN_FROM_RESPONSE"

# Login as Employee
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@example.com",
    "password": "employee123"
  }'
# Save: EMPLOYEE_TOKEN="YOUR_EMPLOYEE_TOKEN_FROM_RESPONSE"
```

---

## Token Variables for Testing

```bash
ADMIN_TOKEN="paste_admin_token_here"
MANAGER_TOKEN="paste_manager_token_here"
EMPLOYEE_TOKEN="paste_employee_token_here"
```

---

## Step 2: Test All User API Endpoints

### 1. GET /api/users - Get All Users

#### Test 1.1: Admin Can Get All Users ✅
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected Response (200 OK):
{
  "message": "Users fetched successfully",
  "users": [
    {
      "_id": "...",
      "username": "admin_user",
      "email": "admin@example.com",
      "role": "admin"
    },
    {
      "_id": "...",
      "username": "manager_user",
      "email": "manager@example.com",
      "role": "manager"
    },
    {
      "_id": "...",
      "username": "employee_user",
      "email": "employee@example.com",
      "role": "employee"
    }
  ]
}
```

#### Test 1.2: Manager Can Get All Users ✅
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $MANAGER_TOKEN"

# Expected Response (200 OK): Same as above
```

#### Test 1.3: Employee Cannot Get All Users ❌
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN"

# Expected Response (403 Forbidden):
{
  "message": "Forbidden: You do not have the required role to access this resource."
}
```

#### Test 1.4: No Token Returns Unauthorized ❌
```bash
curl -X GET http://localhost:3000/api/users

# Expected Response (401 Unauthorized):
{
  "message": "Unauthorized"
}
```

---

### 2. POST /api/users - Create New User

#### Test 2.1: Admin Can Create User ✅
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "username": "new_user",
    "email": "newuser@company.com",
    "password": "newpass123",
    "role": "manager"
  }'

# Expected Response (201 Created):
{
  "message": "User created successfully by admin",
  "user": {
    "username": "new_user",
    "email": "newuser@company.com",
    "role": "manager"
  }
}

# Save the user ID for later tests
NEW_USER_ID="..."
```

#### Test 2.2: Manager Cannot Create User ❌
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -d '{
    "username": "another_user",
    "email": "another@company.com",
    "password": "another123",
    "role": "employee"
  }'

# Expected Response (403 Forbidden):
{
  "message": "Forbidden: You do not have the required role to access this resource."
}
```

#### Test 2.3: Employee Cannot Create User ❌
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -d '{
    "username": "test_user",
    "email": "test@company.com",
    "password": "test123",
    "role": "admin"
  }'

# Expected Response (403 Forbidden):
{
  "message": "Forbidden: You do not have the required role to access this resource."
}
```

#### Test 2.4: Missing Required Role Field ❌
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "username": "no_role_user",
    "email": "norole@company.com",
    "password": "norole123"
  }'

# Expected Response (400 Bad Request):
{
  "message": "Role is required when creating a user"
}
```

---

### 3. GET /api/users/:id - Get User by ID

#### Test 3.1: Admin Can Get User by ID ✅
```bash
curl -X GET http://localhost:3000/api/users/$NEW_USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected Response (200 OK):
{
  "message": "User fetched successfully",
  "user": {
    "_id": "$NEW_USER_ID",
    "username": "new_user",
    "email": "newuser@company.com",
    "role": "manager"
  }
}
```

#### Test 3.2: Manager Can Get User by ID ✅
```bash
curl -X GET http://localhost:3000/api/users/$NEW_USER_ID \
  -H "Authorization: Bearer $MANAGER_TOKEN"

# Expected Response (200 OK): Same as above
```

#### Test 3.3: Employee Cannot Get Any User ❌
```bash
curl -X GET http://localhost:3000/api/users/$NEW_USER_ID \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN"

# Expected Response (403 Forbidden):
{
  "message": "Forbidden: You do not have the required role to access this resource."
}
```

#### Test 3.4: Invalid User ID Returns 404 ❌
```bash
curl -X GET http://localhost:3000/api/users/invalid123 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected Response (404 Not Found):
{
  "message": "User not found"
}
```

---

### 4. PATCH /api/users/:id - Update User

#### Test 4.1: Admin Can Update User ✅
```bash
curl -X PATCH http://localhost:3000/api/users/$NEW_USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "username": "updated_user",
    "email": "updated@company.com",
    "role": "admin"
  }'

# Expected Response (200 OK):
{
  "message": "User updated successfully",
  "user": {
    "_id": "$NEW_USER_ID",
    "username": "updated_user",
    "email": "updated@company.com",
    "role": "admin"
  }
}
```

#### Test 4.2: Admin Can Update Only Some Fields ✅
```bash
curl -X PATCH http://localhost:3000/api/users/$NEW_USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "username": "partially_updated"
  }'

# Expected Response (200 OK):
# Only username is updated, other fields remain unchanged
{
  "message": "User updated successfully",
  "user": {
    "_id": "$NEW_USER_ID",
    "username": "partially_updated",
    "email": "updated@company.com",
    "role": "admin"
  }
}
```

#### Test 4.3: Manager Cannot Update User ❌
```bash
curl -X PATCH http://localhost:3000/api/users/$NEW_USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -d '{
    "username": "hack_attempt"
  }'

# Expected Response (403 Forbidden):
{
  "message": "Forbidden: You do not have the required role to access this resource."
}
```

#### Test 4.4: Employee Cannot Update User ❌
```bash
curl -X PATCH http://localhost:3000/api/users/$NEW_USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -d '{
    "username": "another_hack"
  }'

# Expected Response (403 Forbidden):
{
  "message": "Forbidden: You do not have the required role to access this resource."
}
```

---

### 5. DELETE /api/users/:id - Delete User

#### Test 5.1: Admin Can Delete User ✅
```bash
# First create a user to delete
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "username": "user_to_delete",
    "email": "delete@company.com",
    "password": "delete123",
    "role": "employee"
  }'
# Save the ID as DELETE_USER_ID

# Now delete it
curl -X DELETE http://localhost:3000/api/users/$DELETE_USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected Response (200 OK):
{
  "message": "User deleted successfully"
}
```

#### Test 5.2: Verify User is Deleted ✅
```bash
# Try to get the deleted user
curl -X GET http://localhost:3000/api/users/$DELETE_USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected Response (404 Not Found):
{
  "message": "User not found"
}
```

#### Test 5.3: Manager Cannot Delete User ❌
```bash
curl -X DELETE http://localhost:3000/api/users/$NEW_USER_ID \
  -H "Authorization: Bearer $MANAGER_TOKEN"

# Expected Response (403 Forbidden):
{
  "message": "Forbidden: You do not have the required role to access this resource."
}
```

#### Test 5.4: Employee Cannot Delete User ❌
```bash
curl -X DELETE http://localhost:3000/api/users/$NEW_USER_ID \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN"

# Expected Response (403 Forbidden):
{
  "message": "Forbidden: You do not have the required role to access this resource."
}
```

---

### 6. PATCH /api/users/:id/role - Update User Role

#### Test 6.1: Admin Can Update User Role ✅
```bash
curl -X PATCH http://localhost:3000/api/users/$NEW_USER_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "role": "manager"
  }'

# Expected Response (200 OK):
{
  "message": "User updated successfully",
  "user": {
    "_id": "$NEW_USER_ID",
    "username": "partially_updated",
    "email": "updated@company.com",
    "role": "manager"
  }
}
```

#### Test 6.2: Manager Cannot Update User Role ❌
```bash
curl -X PATCH http://localhost:3000/api/users/$NEW_USER_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -d '{
    "role": "admin"
  }'

# Expected Response (403 Forbidden):
{
  "message": "Forbidden: You do not have the required role to access this resource."
}
```

#### Test 6.3: Employee Cannot Update User Role ❌
```bash
curl -X PATCH http://localhost:3000/api/users/$NEW_USER_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -d '{
    "role": "admin"
  }'

# Expected Response (403 Forbidden):
{
  "message": "Forbidden: You do not have the required role to access this resource."
}
```

---

## Test Summary Table

| Test | Endpoint | Method | Role | Expected | Result |
|------|----------|--------|------|----------|--------|
| 1.1 | /api/users | GET | Admin | 200 ✅ | |
| 1.2 | /api/users | GET | Manager | 200 ✅ | |
| 1.3 | /api/users | GET | Employee | 403 ❌ | |
| 2.1 | /api/users | POST | Admin | 201 ✅ | |
| 2.2 | /api/users | POST | Manager | 403 ❌ | |
| 2.3 | /api/users | POST | Employee | 403 ❌ | |
| 3.1 | /api/users/:id | GET | Admin | 200 ✅ | |
| 3.2 | /api/users/:id | GET | Manager | 200 ✅ | |
| 3.3 | /api/users/:id | GET | Employee | 403 ❌ | |
| 4.1 | /api/users/:id | PATCH | Admin | 200 ✅ | |
| 4.2 | /api/users/:id | PATCH | Manager | 403 ❌ | |
| 5.1 | /api/users/:id | DELETE | Admin | 200 ✅ | |
| 5.2 | /api/users/:id | DELETE | Manager | 403 ❌ | |
| 6.1 | /api/users/:id/role | PATCH | Admin | 200 ✅ | |
| 6.2 | /api/users/:id/role | PATCH | Manager | 403 ❌ | |

---

## Quick Testing Script

Save this as `test-users.sh`:

```bash
#!/bin/bash

API="http://localhost:3000/api"
ADMIN_TOKEN="your_admin_token"
MANAGER_TOKEN="your_manager_token"
EMPLOYEE_TOKEN="your_employee_token"

echo "=== Testing User API Endpoints ==="

echo -e "\n1. Get All Users (Admin)"
curl -X GET $API/users -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n\n2. Get All Users (Manager)"
curl -X GET $API/users -H "Authorization: Bearer $MANAGER_TOKEN"

echo -e "\n\n3. Get All Users (Employee - Should Fail)"
curl -X GET $API/users -H "Authorization: Bearer $EMPLOYEE_TOKEN"

echo -e "\n\n4. Create User (Admin)"
curl -X POST $API/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "username": "test_user",
    "email": "test@company.com",
    "password": "test123",
    "role": "manager"
  }'

echo -e "\n\nDone!"
```

Run with: `bash test-users.sh`


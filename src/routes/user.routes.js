import { Router } from "express";
import {
  createUserByAdmin,
  deleteUserById,
  getUserById,
  updateUserById,
  getAllUsers,
} from "../controllers/user.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import authorizeRole from "../middleware/authorizeRole.middleware.js";
import { enumRoles } from "../utils/permissions.utils.js";

const router = Router();

// Admin-only routes for user management

// Get all users or create a new user
// GET  /api/users - Get all users (admin, manager)
// POST /api/users - Create a new user (admin only)
router
  .route("/users")
  .get(
    authenticateUser,
    authorizeRole(enumRoles.ADMIN, enumRoles.MANAGER),
    getAllUsers,
  )
  .post(authenticateUser, authorizeRole(enumRoles.ADMIN), createUserByAdmin);

// Get, update, or delete a specific user
// GET    /api/users/:id - Get user by ID (admin, manager)
// PATCH  /api/users/:id - Update user by ID (admin only)
// DELETE /api/users/:id - Delete user (admin only)
router
  .route("/users/:id")
  .get(
    authenticateUser,
    authorizeRole(enumRoles.ADMIN, enumRoles.MANAGER),
    getUserById,
  )
  .patch(authenticateUser, authorizeRole(enumRoles.ADMIN), updateUserById)
  .delete(authenticateUser, authorizeRole(enumRoles.ADMIN), deleteUserById);

// Update user role
// PATCH /api/users/:id/role - Update user role (admin only)
router
  .route("/users/:id/role")
  .patch(authenticateUser, authorizeRole(enumRoles.ADMIN), updateUserById);

export default router;

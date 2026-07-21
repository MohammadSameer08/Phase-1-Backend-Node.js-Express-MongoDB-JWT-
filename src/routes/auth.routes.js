import { Router } from "express";
import {
  registerUser,
  updatePassword,
  loginUser,
  getCurrentUser,
  logoutUser,
  updateProfile,
  deleteMe,
} from "../controllers/auth.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.route("/register").post(registerUser); // Self-registration (always creates employee)
router.route("/login").post(loginUser);

// Protected routes
router.route("/logout").post(authenticateUser, logoutUser);
router
  .route("/me")
  .get(authenticateUser, getCurrentUser)
  .delete(authenticateUser, deleteMe);
router.route("/update-password").patch(authenticateUser, updatePassword);
router.route("/profile").patch(authenticateUser, updateProfile);

export default router;

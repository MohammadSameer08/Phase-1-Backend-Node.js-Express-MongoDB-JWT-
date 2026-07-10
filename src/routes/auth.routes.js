import { Router } from "express";
import {
  registerUser,
  updatePassword,
  loginUser,
  getCurrentUser,
  logoutUser,
  updateProfile
} from "../controllers/auth.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = Router();

// Define a simple route for testing
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.route("/me").get(authenticateUser, getCurrentUser);
router.route("/update-password").patch(authenticateUser, updatePassword);
router.route("/profile").patch(authenticateUser, updateProfile);

export default router;

import { Router } from "express";
import {
  registerUser,
  updatePassword,
} from "../controllers/auth.controller.js";
import { loginUser } from "../controllers/auth.controller.js";
import { getCurrentUser } from "../controllers/auth.controller.js";
import { logoutUser } from "../controllers/auth.controller.js";
import {
  authenticateUser,
} from "../middleware/auth.middleware.js";

const router = Router();

// Define a simple route for testing
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.route("/me").get(authenticateUser, getCurrentUser);
router.route("/update-password").patch(authenticateUser, updatePassword);

export default router;

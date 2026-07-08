import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";
import { loginUser } from "../controllers/auth.controller.js";
import { getCurrentUser } from "../controllers/auth.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = Router();

// Define a simple route for testing
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/me").get(authenticateUser,getCurrentUser);

export default router;

import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";
import { loginUser } from "../controllers/auth.controller.js";
import { getCurrentUser } from "../controllers/auth.controller.js";
import {
  authenticateUser,
  optionalAuthenticate,
} from "../middleware/auth.middleware.js";

const router = Router();

// Define a simple route for testing
router.route("/register").post(registerUser);
// Define a route for user login. If JWT is present in cookies and it is valid, then login user directly without checking credentials.
// If JWT is not present or invalid, then check credentials email and password and login user.
// Not using authenticateUser middleware here because we want to allow login even if the user is not authenticated authenticateUser functions throws error and controller will not execute.
router.route("/login").post(optionalAuthenticate, loginUser);
router.route("/me").get(authenticateUser, getCurrentUser);

export default router;

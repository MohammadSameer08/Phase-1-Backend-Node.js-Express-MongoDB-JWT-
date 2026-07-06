import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";

const router = Router();

// Define a simple route for testing
router.post("/register", registerUser);

export default router;

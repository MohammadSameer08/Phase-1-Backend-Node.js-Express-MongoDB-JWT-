import { Router } from "express";
import { createNote, getNotes } from "../controllers/note.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = Router();

// Define a simple route for testing
router.route("/").post(authenticateUser, createNote).get(authenticateUser, getNotes);
//router.route("/:id").get().patch().delete();

export default router;

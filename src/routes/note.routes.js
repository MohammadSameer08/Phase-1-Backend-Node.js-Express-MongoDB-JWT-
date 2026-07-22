import { Router } from "express";
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
} from "../controllers/note.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = Router();

// Define a simple route for testing
router
  .route("/")
  .post(authenticateUser, createNote)
  .get(authenticateUser, getNotes);
router
  .route("/:id")
  .get(authenticateUser, getNoteById)
  .patch(authenticateUser, updateNote)
  .delete(authenticateUser, deleteNote);

export default router;

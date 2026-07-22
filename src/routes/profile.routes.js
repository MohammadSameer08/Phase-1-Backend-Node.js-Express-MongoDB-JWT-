import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { updateAvatar } from "../controllers/profile.controller.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router
  .route("/avatar")
  .patch(authenticateUser, upload.single("avatar"), updateAvatar);

export default router;

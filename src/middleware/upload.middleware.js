// @ts-ignore
import multer from "multer";
import path from "path";

// Step 2: Configure diskStorage
export const storage = multer.diskStorage({
  // @ts-ignore
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars/"); // Directory to save files
  },
  filename: (req, file, cb) => {
    // @ts-ignore
    const userId = req.user._id;
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Step 3: Create upload.single("avatar")
export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  // @ts-ignore
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
        ),
      );
    }
  },
});

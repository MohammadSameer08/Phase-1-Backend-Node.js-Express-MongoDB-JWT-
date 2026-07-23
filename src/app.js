import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import morgan from "morgan";
import logger from "./config/logger.js";

// Create an instance of the Express application
const app = express();
logger.info("Initializing Express application...");

// Configure CORS middleware to allow requests from the frontend
logger.info("Setting up CORS middleware");
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
  }),
);

app.use(cookieParser()); // Middleware to parse cookies
logger.info("Cookie parser middleware initialized");

// Middleware to serve static files from uploads directory
app.use("/uploads", express.static("uploads"));
logger.info("Static file serving configured for /uploads");

// Middleware to parse incoming JSON requests
app.use(express.json());
logger.info("JSON body parser middleware initialized");

// Middleware to set various HTTP headers for security
app.use(helmet());
logger.info("Helmet security headers middleware initialized");

// Rate limiting middleware to limit the number of requests from a single IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use(authLimiter);
logger.info("Rate limiting middleware applied (5 requests per 15 minutes)");

// Middleware to prevent HTTP Parameter Pollution attacks
app.use(hpp());
logger.info("HTTP Parameter Pollution protection middleware initialized");

// Use morgan for logging HTTP requests, integrated with winston logger
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);
logger.info("Morgan HTTP request logger initialized");

// Define a simple route for testing
app.get("/", (req, res) => {
  logger.info("Test endpoint accessed: GET /");
  res.send("Hello, Sameer! Welcome to the User Authentication API.");
});

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import noteRoutes from "./routes/note.routes.js";
import profileRoutes from "./routes/profile.routes.js";

// Use the authentication routes for any requests starting with /api/auth
app.use("/api/auth", authRoutes);
logger.info("Authentication routes registered at /api/auth");

// Use the user management routes for any requests starting with /api
app.use("/api", userRoutes);
logger.info("User management routes registered at /api");

// Use the note routes for any requests starting with /api/notes
app.use("/api/notes", noteRoutes);
logger.info("Note management routes registered at /api/notes");

// Use the profile routes for any requests starting with /api/profile
app.use("/api/profile", profileRoutes);
logger.info("Profile routes registered at /api/profile");

export default app;

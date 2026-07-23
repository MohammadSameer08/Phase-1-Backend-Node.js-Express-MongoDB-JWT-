import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

// Create an instance of the Express application
const app = express();

// Configure CORS middleware to allow requests from the frontend
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
  }),
);

app.use(cookieParser()); // Middleware to parse cookies

// Middleware to serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Middleware to parse incoming JSON requests
app.use(express.json());

// Middleware to set various HTTP headers for security
app.use(helmet());

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

// Middleware to sanitize user input and prevent NoSQL injection
app.use(mongoSanitize());

// Middleware to prevent HTTP Parameter Pollution attacks
app.use(hpp());

// Define a simple route for testing
app.get("/", (req, res) => {
  res.send("Hello, Sameer! Welcome to the User Authentication API.");
});

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import noteRoutes from "./routes/note.routes.js";
import profileRoutes from "./routes/profile.routes.js";

// Use the authentication routes for any requests starting with /api/auth
app.use("/api/auth", authRoutes);

// Use the user management routes for any requests starting with /api
app.use("/api", userRoutes);

// Use the note routes for any requests starting with /api/notes
app.use("/api/notes", noteRoutes);

// Use the profile routes for any requests starting with /api/profile
app.use("/api/profile", profileRoutes);

export default app;

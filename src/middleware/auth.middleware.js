import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to authenticate user using JWT
// @ts-ignore
export const authenticateUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; // Assuming the token is stored in cookies or Authorization header
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "");
    if (typeof decoded === "string") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized", error });
  }
};

// Optional authentication middleware - validates JWT if present, but doesn't reject if missing
// Used for routes that can handle both authenticated and unauthenticated requests (e.g., login)
// @ts-ignore
export const optionalAuthenticate = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    // No token present, proceed without authentication
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "");
    if (typeof decoded === "string") {
      // Invalid token, proceed without authentication
      return next();
    }
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    // Token verification failed, proceed without authentication
    next();
  }
};

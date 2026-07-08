import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to authenticate user using JWT
// @ts-ignore
export const authenticateUser = async (req, res, next) => {
  const token = req.cookies.token; // Assuming the token is stored in cookies
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
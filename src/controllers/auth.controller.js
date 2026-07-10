// @ts-nocheck
import User from "../models/User.js";
import bcrypt from "bcrypt"; // Import bcrypt for password hashing

// @ts-ignore
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password before saving
    const user = new User({ username, email, password: hashedPassword });
    // @ts-ignore
    const accessToken = await user.generateAccessToken(); // Generate JWT token
    await user.save();
    res
      .status(201)
      .cookie("token", accessToken, { httpOnly: true })
      .json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
};

// @ts-ignore
export const loginUser = async (req, res) => {
  // Check if the user is already logged in using jwt cookies
  if (req.user) {
    return res
      .status(200)
      .json({ message: "User already logged in", user: req.user });
  }
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Add password verification logic here
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const accessToken = await user.generateAccessToken(); // Generate JWT token
    res
      .status(200)
      .cookie("token", accessToken, { httpOnly: true })
      .json({ message: "User logged in successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error logging in user", error });
  }
};

// @ts-ignore
export const getCurrentUser = async (req, res) => {
  try {
    // Assuming you have a way to get the current user's ID from the request (e.g., from a token)
    return res
      .status(200)
      .json({ user: req.user, message: "Current user fetched successfully" }); // req.user should be set by authentication middleware
  } catch (error) {
    res.status(500).json({ message: "Error fetching current user", error });
  }
};

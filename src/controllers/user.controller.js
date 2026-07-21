import User from "../models/User.js";
import bcrypt from "bcrypt"; // Import bcrypt for password hashing

// @ts-ignore
// Admin creates user endpoint - Only admins can call this
export const createUserByAdmin = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    // Validate that role is provided
    if (!role) {
      return res
        .status(400)
        .json({ message: "Role is required when creating a user" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password before saving
    const user = new User({ username, email, password: hashedPassword, role });
    await user.save();

    res.status(201).json({
      message: "User created successfully by admin",
      user: { username, email, role },
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
};

// @ts-ignore
export const updateProfile = async (req, res) => {
  const { username } = req.body;
  try {
    const user = req.user; // Assuming req.user is set by the authentication middleware
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.username = username || user.username;
    await user.save();
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile", error });
  }
};

// @ts-ignore
export const deleteUserById = async (req, res) => {
  try {
    const userId = req.params.id; // Get the user ID from the request parameters
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user", error });
  }
};

// @ts-ignore
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id; // Get the user ID from the request parameters
    const user = await User.findById(userId).select("-password"); // Exclude password from the response
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User fetched successfully", user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user", error });
  }
};

// @ts-ignore
export const updateUserById = async (req, res) => {
  try {
    const userId = req.params.id; // Get the user ID from the request parameters
    const { username, email, role } = req.body; // Get the updated fields from the request body
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Update the fields if they are provided in the request body
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    await user.save();
    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user", error });
    // @ts-ignore
  }
};

// @ts-ignore
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude password from the response
    res.status(200).json({ message: "Users fetched successfully", users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error });
  }
};

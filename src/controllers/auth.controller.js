import User from "../models/User.js";
import bcrypt from "bcrypt"; // Import bcrypt for password hashing

// @ts-ignore
export const registerUser = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password before saving
    const user = new User({ username, email, password: hashedPassword, role });
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
    // @ts-ignore
    const accessToken = await user.generateAccessToken(); // Generate JWT token
    res
      .status(200)
      .cookie("token", accessToken, { httpOnly: true })
      .json({ message: "User logged in successfully", user });
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

// @ts-ignore
export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token"); // Clear the token cookie
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error logging out user", error });
  }
};

// @ts-ignore
export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    // Refetch the user with password field included
    // The password field is marked as select: false in the User model,
    // so it's not included in req.user from the auth middleware.
    // We must explicitly select it using .select("+password") for bcrypt.compare() to work
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Compare the provided current password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid current password" });
    }
    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Error updating password", error });
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

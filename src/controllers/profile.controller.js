import User from "../models/User.js";

// @ts-ignore
export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    const avatarPath = req.file?.path; // Get the file path from multer

    if (!avatarPath) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarPath },
      { new: true },
    ).select("-password");

    res.status(200).json({
      message: "Avatar updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ message: "Error updating avatar", error });
  }
};

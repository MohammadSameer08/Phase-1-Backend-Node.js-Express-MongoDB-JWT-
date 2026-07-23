import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Define the User schema

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["employee", "admin", "manager"],
      default: "employee",
    },
    avatar: {
      type: String,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.methods.generateAccessToken = function () {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET || "", {
    expiresIn: "1h", // Set the token expiration time
  });
  return token;
};

userSchema.methods.generateRefreshToken = function () {
  const refreshToken = jwt.sign({ id: this._id }, process.env.JWT_SECRET || "", {
    expiresIn: "7d", // Refresh token valid for 7 days
  });
  return refreshToken;
};

userSchema.methods.generatePasswordResetToken = function () {
  // @ts-ignore
  const resetToken = crypto.randomBytes(32).toString("hex");
  return resetToken;
};

// Create the User model
const User = mongoose.model("User", userSchema);

export default User;

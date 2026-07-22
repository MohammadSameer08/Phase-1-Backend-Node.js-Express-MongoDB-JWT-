import mongoose from "mongoose";
import jwt from "jsonwebtoken";

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
  },
  { timestamps: true },
);

userSchema.methods.generateAccessToken = function () {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET || "", {
    expiresIn: "1h", // Set the token expiration time
  });
  return token;
};

// Create the User model
const User = mongoose.model("User", userSchema);

export default User;

import express from "express";
import dotenv from "dotenv";
import app from "./app.js";

// Load environment variables from the .env file
dotenv.config();

// Get the port from environment variables or use a default value
const PORT = process.env.PORT || 8000;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

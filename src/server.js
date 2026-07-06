import express from "express";
import dotenv from "dotenv";
import app from "./app.js";
import DBConnection from "./config/db.js";

// Load environment variables from the .env file
dotenv.config();

// Get the port from environment variables or use a default value
const PORT = process.env.PORT || 8000;

// Start the server and listen on the specified port
DBConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error.message);
  });

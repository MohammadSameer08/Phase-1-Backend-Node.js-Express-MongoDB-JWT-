import express from "express";
import cors from "cors";

// Create an instance of the Express application
const app = express();

// Configure CORS middleware to allow requests from the frontend
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
  }),
);

// Middleware to parse incoming JSON requests
app.use(express.json());

// Define a simple route for testing
app.get("/", (req, res) => {
  res.send("Hello, Sameer! Welcome to the User Authentication API.");
});

export default app;

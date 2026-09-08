import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "CampusOne backend is running",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`CampusOne backend running on http://localhost:${PORT}`);
});
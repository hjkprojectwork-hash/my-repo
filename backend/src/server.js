import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";

const app = express();

// ================================
// Middleware
// ================================

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

// ================================
// Health Check
// ================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "CampusOne backend is running",
  });
});

// ================================
// Start Server
// ================================

app.listen(env.port, () => {
  console.log(
    `CampusOne backend running on http://localhost:${env.port}`
  );
});
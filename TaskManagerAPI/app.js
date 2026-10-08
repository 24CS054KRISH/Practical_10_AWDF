const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

// Built-in & Custom Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });

const cache = require("./cache");

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Cache Debug & Analytics Endpoints (Supplementary Problem 2 & 3)
app.get("/cache/stats", (req, res) => {
    res.status(200).json({
        status: "success",
        data: cache.getCustomStats()
    });
});
app.post("/cache/clear", (req, res) => {
    cache.flushAll();
    res.status(200).json({
        message: "In-memory cache cleared successfully",
        data: cache.getCustomStats()
    });
});

// Authentication Routes (Supports /auth/register, /auth/login, /auth/me)
app.use("/auth", authRoutes);

// Direct root aliases as specified in the Practical 7 architecture diagram
app.post("/register", (req, res, next) => {
    req.url = "/register";
    authRoutes(req, res, next);
});
app.post("/login", (req, res, next) => {
    req.url = "/login";
    authRoutes(req, res, next);
});
app.get("/me", (req, res, next) => {
    req.url = "/me";
    authRoutes(req, res, next);
});

// Protected Task Routes
app.use("/tasks", taskRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;

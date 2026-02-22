const express        = require("express");
const cors           = require("cors");
require("./db");                          // init DB + seed on startup

const authRoutes      = require("./authRoutes");
const userRoutes      = require("./userRoutes");
const adminRoutes     = require("./adminRoutes");
const collectorRoutes = require("./collectorRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// ── Mount routes ──────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/user",      userRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api/collector", collectorRoutes);

// ── Start ─────────────────────────────────────────────────
const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server → http://localhost:${PORT}`));
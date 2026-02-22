const express = require("express");
const router  = express.Router();
const db      = require("./db");

// POST /api/auth/user  — room number login
router.post("/user", (req, res) => {
  const { room_number } = req.body;
  if (!room_number)
    return res.status(400).json({ success: false, message: "Room number required" });

  const user = db
    .prepare("SELECT * FROM users WHERE room_number = ?")
    .get(room_number.trim());

  if (!user)
    return res.status(404).json({ success: false, message: "Room not found!" });

  const garbageStatus = db
    .prepare("SELECT * FROM garbage_status WHERE room_number = ?")
    .get(room_number.trim());

  res.json({ success: true, user, garbageStatus });
});

// POST /api/auth/admin  — admin code login
router.post("/admin", (req, res) => {
  const { admin_code } = req.body;
  if (!admin_code)
    return res.status(400).json({ success: false, message: "Admin code required" });

  const admin = db
    .prepare("SELECT * FROM admins WHERE admin_code = ?")
    .get(admin_code.trim().toUpperCase());

  if (!admin)
    return res.status(404).json({ success: false, message: "Invalid admin code!" });

  res.json({ success: true, admin });
});

// POST /api/auth/collector  — emp_no login
router.post("/collector", (req, res) => {
  const { emp_no } = req.body;
  if (!emp_no)
    return res.status(400).json({ success: false, message: "EMP number required" });

  const collector = db
    .prepare("SELECT * FROM collectors WHERE emp_no = ?")
    .get(emp_no.trim().toUpperCase());

  if (!collector)
    return res.status(404).json({ success: false, message: "Employee not found!" });

  res.json({ success: true, collector });
});

module.exports = router;
const express = require("express");
const router  = express.Router();
const db      = require("./db");

// GET /api/user/:room  — get current garbage status
router.get("/:room", (req, res) => {
  const gs = db
    .prepare("SELECT * FROM garbage_status WHERE room_number = ?")
    .get(req.params.room);

  if (!gs)
    return res.status(404).json({ success: false, message: "Room not found" });

  res.json({ success: true, garbageStatus: gs });
});

// POST /api/user/report  — resident reports garbage with size
router.post("/report", (req, res) => {
  const { room_number, size } = req.body;

  if (!room_number || !size)
    return res.status(400).json({ success: false, message: "room_number and size required" });

  if (!["S", "L", "XL"].includes(size))
    return res.status(400).json({ success: false, message: "Size must be S, L, or XL" });

  const gs = db
    .prepare("SELECT * FROM garbage_status WHERE room_number = ?")
    .get(room_number);

  if (!gs)
    return res.status(404).json({ success: false, message: "Room not found" });

  if (gs.status !== "clear" && gs.status !== "done")
    return res.status(409).json({
      success: false,
      message: `Already ${gs.status}. Wait for collection.`,
      garbageStatus: gs,
    });

  db.prepare(`
    UPDATE garbage_status
    SET has_garbage   = 1,
        size          = ?,
        status        = 'waiting',
        reported_at   = CURRENT_TIMESTAMP,
        updated_at    = CURRENT_TIMESTAMP,
        assigned_to   = NULL,
        assigned_name = NULL,
        accepted_at   = NULL,
        collected_at  = NULL
    WHERE room_number = ?
  `).run(size, room_number);

  const updated = db
    .prepare("SELECT * FROM garbage_status WHERE room_number = ?")
    .get(room_number);

  res.json({ success: true, garbageStatus: updated });
});

// POST /api/user/clear  — resident marks no garbage
router.post("/clear", (req, res) => {
  const { room_number } = req.body;
  if (!room_number)
    return res.status(400).json({ success: false, message: "room_number required" });

  db.prepare(`
    UPDATE garbage_status
    SET has_garbage   = 0,
        size          = NULL,
        status        = 'clear',
        reported_at   = NULL,
        assigned_to   = NULL,
        assigned_name = NULL,
        accepted_at   = NULL,
        collected_at  = NULL,
        updated_at    = CURRENT_TIMESTAMP
    WHERE room_number = ?
  `).run(room_number);

  const updated = db
    .prepare("SELECT * FROM garbage_status WHERE room_number = ?")
    .get(room_number);

  res.json({ success: true, garbageStatus: updated });
});

module.exports = router;
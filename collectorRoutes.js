const express = require("express");
const router  = express.Router();
const db      = require("./db");

// GET /api/collector/pending  — all waiting rooms
router.get("/pending", (req, res) => {
  const rooms = db.prepare(`
    SELECT * FROM garbage_status
    WHERE status = 'waiting'
    ORDER BY reported_at ASC
  `).all();

  res.json({ success: true, rooms, count: rooms.length });
});

// GET /api/collector/:id/active  — rooms accepted by this collector
router.get("/:id/active", (req, res) => {
  const rooms = db.prepare(`
    SELECT * FROM garbage_status
    WHERE assigned_to = ? AND status = 'collecting'
    ORDER BY accepted_at DESC
  `).all(req.params.id);

  res.json({ success: true, rooms });
});

// GET /api/collector/:id/history  — rooms collected by this collector
router.get("/:id/history", (req, res) => {
  const rooms = db.prepare(`
    SELECT * FROM garbage_status
    WHERE assigned_to = ? AND status = 'done'
    ORDER BY collected_at DESC
    LIMIT 30
  `).all(req.params.id);

  res.json({ success: true, rooms });
});

// PATCH /api/collector/accept  — collector accepts a room
router.patch("/accept", (req, res) => {
  const { room_number, collector_id } = req.body;

  if (!room_number || !collector_id)
    return res.status(400).json({ success: false, message: "room_number and collector_id required" });

  const gs = db
    .prepare("SELECT * FROM garbage_status WHERE room_number = ?")
    .get(room_number);

  if (!gs)
    return res.status(404).json({ success: false, message: "Room not found" });

  if (gs.status !== "waiting")
    return res.status(400).json({ success: false, message: `Room is already ${gs.status}` });

  const collector = db
    .prepare("SELECT * FROM collectors WHERE id = ?")
    .get(collector_id);

  if (!collector)
    return res.status(404).json({ success: false, message: "Collector not found" });

  db.prepare(`
    UPDATE garbage_status
    SET status        = 'collecting',
        assigned_to   = ?,
        assigned_name = ?,
        accepted_at   = CURRENT_TIMESTAMP,
        updated_at    = CURRENT_TIMESTAMP
    WHERE room_number = ?
  `).run(collector.id, collector.name, room_number);

  const updated = db
    .prepare("SELECT * FROM garbage_status WHERE room_number = ?")
    .get(room_number);

  res.json({ success: true, garbageStatus: updated });
});

// PATCH /api/collector/done  — collector marks room as collected
router.patch("/done", (req, res) => {
  const { room_number, collector_id } = req.body;

  if (!room_number || !collector_id)
    return res.status(400).json({ success: false, message: "room_number and collector_id required" });

  const gs = db
    .prepare("SELECT * FROM garbage_status WHERE room_number = ?")
    .get(room_number);

  if (!gs)
    return res.status(404).json({ success: false, message: "Room not found" });

  if (gs.status !== "collecting")
    return res.status(400).json({ success: false, message: "Accept பண்ணாம done பண்ண முடியாது!" });

  if (gs.assigned_to !== collector_id)
    return res.status(403).json({ success: false, message: "இந்த room உங்களுக்கு assign ஆகல!" });

  db.prepare(`
    UPDATE garbage_status
    SET status       = 'done',
        has_garbage  = 0,
        collected_at = CURRENT_TIMESTAMP,
        updated_at   = CURRENT_TIMESTAMP
    WHERE room_number = ?
  `).run(room_number);

  const updated = db
    .prepare("SELECT * FROM garbage_status WHERE room_number = ?")
    .get(room_number);

  res.json({ success: true, garbageStatus: updated });
});

module.exports = router;
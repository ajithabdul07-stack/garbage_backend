const express = require("express");
const router  = express.Router();
const db      = require("./db");

// GET /api/admin/overview  — all rooms sorted by status priority
router.get("/overview", (req, res) => {
  const rooms = db.prepare(`
    SELECT gs.*, u.phone
    FROM garbage_status gs
    JOIN users u ON u.room_number = gs.room_number
    ORDER BY
      CASE gs.status
        WHEN 'waiting'    THEN 1
        WHEN 'collecting' THEN 2
        WHEN 'done'       THEN 3
        WHEN 'clear'      THEN 4
      END,
      gs.updated_at DESC
  `).all();

  const summary = {
    total:      rooms.length,
    clear:      rooms.filter(r => r.status === "clear").length,
    waiting:    rooms.filter(r => r.status === "waiting").length,
    collecting: rooms.filter(r => r.status === "collecting").length,
    done:       rooms.filter(r => r.status === "done").length,
  };

  res.json({ success: true, rooms, summary });
});

module.exports = router;
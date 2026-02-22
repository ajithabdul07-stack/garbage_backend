const Database = require("better-sqlite3");
const path     = require("path");

const db = new Database(path.join(__dirname, "datas.db"));

// ── Create tables ─────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    room_number TEXT NOT NULL UNIQUE,
    phone       TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    admin_code  TEXT NOT NULL UNIQUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS collectors (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    emp_no      TEXT NOT NULL UNIQUE,
    phone       TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS garbage_status (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number   TEXT NOT NULL UNIQUE,
    user_name     TEXT NOT NULL,
    has_garbage   INTEGER NOT NULL DEFAULT 0,
    size          TEXT CHECK(size IN ('S','L','XL')),
    status        TEXT NOT NULL DEFAULT 'clear'
                  CHECK(status IN ('clear','waiting','collecting','done')),
    assigned_to   INTEGER REFERENCES collectors(id),
    assigned_name TEXT,
    reported_at   DATETIME,
    accepted_at   DATETIME,
    collected_at  DATETIME,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Seed users ────────────────────────────────────────────
const uCount = db.prepare("SELECT COUNT(*) as c FROM users").get();
if (uCount.c === 0) {
  const seedUsers = [
    ["Arun Kumar",   "2544", "9876543210"],
    ["Priya Devi",   "1201", "9123456789"],
    ["Ravi Shankar", "3310", "9988776655"],
    ["Meena Kumari", "0405", "9871234560"],
  ];
  const insUser = db.prepare("INSERT INTO users (name, room_number, phone) VALUES (?, ?, ?)");
  const insGs   = db.prepare("INSERT INTO garbage_status (room_number, user_name) VALUES (?, ?)");
  seedUsers.forEach(([name, room, phone]) => {
    insUser.run(name, room, phone);
    insGs.run(room, name);
  });
  console.log("✅ Users seeded");
}

// ── Seed admin ────────────────────────────────────────────
const aCount = db.prepare("SELECT COUNT(*) as c FROM admins").get();
if (aCount.c === 0) {
  db.prepare("INSERT INTO admins (name, admin_code) VALUES (?, ?)").run("Super Admin", "ADMIN123");
  console.log("✅ Admin seeded");
}

// ── Seed collectors ───────────────────────────────────────
const cCount = db.prepare("SELECT COUNT(*) as c FROM collectors").get();
if (cCount.c === 0) {
  const insCol = db.prepare("INSERT INTO collectors (name, emp_no, phone) VALUES (?, ?, ?)");
  insCol.run("Kumar Selvam", "EMP001", "9111222333");
  insCol.run("Mani Raj",     "EMP002", "9444555666");
  insCol.run("Suresh Babu",  "EMP003", "9777888999");
  console.log("✅ Collectors seeded");
}

module.exports = db;
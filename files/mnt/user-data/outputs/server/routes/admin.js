const express = require("express");
const router = express.Router();

const {
  getStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  getFlaggedSongs,
  flagSong,
  unflagSong,
  adminDeleteSong,
  getAllSongs,
} = require("../controllers/admin");

const { protect, authorize } = require("../middleware/auth");

// All admin routes require auth + admin role
router.use(protect);
router.use(authorize("admin"));

// ─── Dashboard Stats ───────────────────────────────────────────────────────────
router.get("/stats", getStats);

// ─── User Management ───────────────────────────────────────────────────────────
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/status", updateUserStatus);
router.put("/users/:id/role", updateUserRole);

// ─── Song Management ───────────────────────────────────────────────────────────
router.get("/songs", getAllSongs);
router.get("/songs/flagged", getFlaggedSongs);
router.put("/songs/:id/flag", flagSong);
router.put("/songs/:id/unflag", unflagSong);
router.delete("/songs/:id", adminDeleteSong);

module.exports = router;

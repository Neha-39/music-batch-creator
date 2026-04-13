const express = require("express");
const router = express.Router();

const {
  getSongs,
  getMySongs,
  getSong,
  uploadSong,
  updateSong,
  deleteSong,
  streamSong,
  searchSongs,
} = require("../controllers/songs");

const { protect, optionalAuth } = require("../middleware/auth");
const { uploadSongWithThumbnail, uploadThumbnail } = require("../middleware/upload");
const advancedResults = require("../middleware/advancedResults");
const Song = require("../models/Song");

// ─── Routes ────────────────────────────────────────────────────────────────────

// Search (before /:id to avoid conflict)
router.get("/search", protect, searchSongs);

// My songs
router.get("/my", protect, getMySongs);

// List all public songs (with filtering/pagination)
router.get(
  "/",
  protect,
  advancedResults(Song, { path: "uploadedBy", select: "username avatar" }),
  getSongs
);

// Upload
router.post("/", protect, uploadSongWithThumbnail, uploadSong);

// Single song CRUD
router
  .route("/:id")
  .get(optionalAuth, getSong)
  .put(protect, uploadThumbnail, updateSong)
  .delete(protect, deleteSong);

// Streaming endpoint
router.get("/:id/stream", optionalAuth, streamSong);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  getPlaylists,
  getMyPlaylists,
  getPlaylist,
  getPlaylistByShareToken,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  reorderPlaylistSongs,
} = require("../controllers/playlists");

const { protect, optionalAuth } = require("../middleware/auth");
const { uploadThumbnail } = require("../middleware/upload");
const advancedResults = require("../middleware/advancedResults");
const Playlist = require("../models/Playlist");

// ─── Routes ────────────────────────────────────────────────────────────────────

// Share token (public, no auth needed)
router.get("/share/:token", getPlaylistByShareToken);

// My playlists
router.get("/my", protect, getMyPlaylists);

// List all public playlists
router.get(
  "/",
  protect,
  advancedResults(Playlist, [
    { path: "createdBy", select: "username avatar" },
    { path: "songs.song", select: "title artist thumbnailUrl duration" },
  ]),
  getPlaylists
);

// Create
router.post("/", protect, uploadThumbnail, createPlaylist);

// Single playlist CRUD
router
  .route("/:id")
  .get(optionalAuth, getPlaylist)
  .put(protect, uploadThumbnail, updatePlaylist)
  .delete(protect, deletePlaylist);

// Songs in playlist
router.post("/:id/songs", protect, addSongToPlaylist);
router.delete("/:id/songs/:songId", protect, removeSongFromPlaylist);
router.put("/:id/reorder", protect, reorderPlaylistSongs);

module.exports = router;

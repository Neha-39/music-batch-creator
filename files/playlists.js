const Playlist = require("../models/Playlist");
const Song = require("../models/Song");
const User = require("../models/User");
const ErrorResponse = require("../utils/ErrorResponse");

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all public playlists
// @route   GET /api/playlists
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getPlaylists = async (req, res, next) => {
  try {
    res.status(200).json(res.advancedResults);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get current user's playlists
// @route   GET /api/playlists/my
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyPlaylists = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { createdBy: req.user.id };
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const [playlists, total] = await Promise.all([
      Playlist.find(filter)
        .sort("-createdAt")
        .skip(skip)
        .limit(limit)
        .populate({
          path: "songs.song",
          select: "title artist thumbnailUrl duration",
        })
        .populate("createdBy", "username avatar"),
      Playlist.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: playlists.length,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      data: playlists,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single playlist by ID
// @route   GET /api/playlists/:id
// @access  Private / Public (if isPublic)
// ─────────────────────────────────────────────────────────────────────────────
exports.getPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate({
        path: "songs.song",
        select: "title artist album genre duration fileUrl thumbnailUrl playCount uploadedBy",
        populate: { path: "uploadedBy", select: "username avatar" },
      })
      .populate("createdBy", "username avatar");

    if (!playlist) {
      return next(new ErrorResponse("Playlist not found.", 404));
    }

    // Private playlist — only owner or admin
    if (
      !playlist.isPublic &&
      (!req.user ||
        (playlist.createdBy._id.toString() !== req.user.id &&
          req.user.role !== "admin"))
    ) {
      return next(new ErrorResponse("This playlist is private.", 403));
    }

    // Increment play count
    Playlist.findByIdAndUpdate(playlist._id, { $inc: { playCount: 1 } }).exec();

    res.status(200).json({ success: true, data: playlist });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get playlist by share token (public access via link)
// @route   GET /api/playlists/share/:token
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.getPlaylistByShareToken = async (req, res, next) => {
  try {
    const playlist = await Playlist.findOne({ shareToken: req.params.token })
      .populate({
        path: "songs.song",
        select: "title artist album genre duration fileUrl thumbnailUrl playCount",
      })
      .populate("createdBy", "username avatar");

    if (!playlist) {
      return next(new ErrorResponse("Playlist not found or link is invalid.", 404));
    }

    // Share token only works for public playlists
    if (!playlist.isPublic) {
      return next(new ErrorResponse("This playlist is private.", 403));
    }

    res.status(200).json({ success: true, data: playlist });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new playlist
// @route   POST /api/playlists
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.createPlaylist = async (req, res, next) => {
  try {
    const { name, description, isPublic, tags, genre } = req.body;

    const playlist = await Playlist.create({
      name,
      description,
      isPublic: isPublic === true || isPublic === "true",
      tags: tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(",").map((t) => t.trim())
        : [],
      genre,
      createdBy: req.user.id,
      coverImage: req.file
        ? `/uploads/thumbnails/${req.file.filename}`
        : null,
    });

    // Increment user playlist count
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalPlaylists: 1 } });

    res.status(201).json({ success: true, data: playlist });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update playlist details
// @route   PUT /api/playlists/:id
// @access  Private (owner or admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.updatePlaylist = async (req, res, next) => {
  try {
    let playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return next(new ErrorResponse("Playlist not found.", 404));
    }

    if (
      playlist.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(new ErrorResponse("Not authorized to update this playlist.", 403));
    }

    const allowedFields = ["name", "description", "isPublic", "tags", "genre"];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.file) {
      updates.coverImage = `/uploads/thumbnails/${req.file.filename}`;
    }

    playlist = await Playlist.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate({
      path: "songs.song",
      select: "title artist thumbnailUrl duration",
    });

    res.status(200).json({ success: true, data: playlist });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a playlist
// @route   DELETE /api/playlists/:id
// @access  Private (owner or admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.deletePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return next(new ErrorResponse("Playlist not found.", 404));
    }

    if (
      playlist.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(new ErrorResponse("Not authorized to delete this playlist.", 403));
    }

    await playlist.deleteOne();

    await User.findByIdAndUpdate(req.user.id, { $inc: { totalPlaylists: -1 } });

    res.status(200).json({ success: true, message: "Playlist deleted successfully." });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Add a song to a playlist
// @route   POST /api/playlists/:id/songs
// @access  Private (owner)
// ─────────────────────────────────────────────────────────────────────────────
exports.addSongToPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return next(new ErrorResponse("Playlist not found.", 404));
    }

    if (playlist.createdBy.toString() !== req.user.id) {
      return next(new ErrorResponse("Not authorized to modify this playlist.", 403));
    }

    const { songId } = req.body;
    if (!songId) {
      return next(new ErrorResponse("Please provide a song ID.", 400));
    }

    const song = await Song.findById(songId);
    if (!song) {
      return next(new ErrorResponse("Song not found.", 404));
    }

    // Check for duplicate
    const alreadyAdded = playlist.songs.some(
      (item) => item.song.toString() === songId
    );
    if (alreadyAdded) {
      return next(new ErrorResponse("Song is already in this playlist.", 400));
    }

    // Add song with order = current length
    playlist.songs.push({
      song: songId,
      order: playlist.songs.length,
    });

    await playlist.save();

    // Populate and return the updated playlist
    await playlist.populate({
      path: "songs.song",
      select: "title artist album thumbnailUrl duration",
    });

    res.status(200).json({ success: true, data: playlist });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Remove a song from a playlist
// @route   DELETE /api/playlists/:id/songs/:songId
// @access  Private (owner)
// ─────────────────────────────────────────────────────────────────────────────
exports.removeSongFromPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return next(new ErrorResponse("Playlist not found.", 404));
    }

    if (playlist.createdBy.toString() !== req.user.id) {
      return next(new ErrorResponse("Not authorized to modify this playlist.", 403));
    }

    const songExists = playlist.songs.some(
      (item) => item.song.toString() === req.params.songId
    );
    if (!songExists) {
      return next(new ErrorResponse("Song not found in this playlist.", 404));
    }

    playlist.songs = playlist.songs.filter(
      (item) => item.song.toString() !== req.params.songId
    );

    // Re-order remaining songs
    playlist.songs.forEach((item, idx) => {
      item.order = idx;
    });

    await playlist.save();

    res.status(200).json({ success: true, data: playlist });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Reorder songs in a playlist
// @route   PUT /api/playlists/:id/reorder
// @access  Private (owner)
// ─────────────────────────────────────────────────────────────────────────────
exports.reorderPlaylistSongs = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return next(new ErrorResponse("Playlist not found.", 404));
    }

    if (playlist.createdBy.toString() !== req.user.id) {
      return next(new ErrorResponse("Not authorized to modify this playlist.", 403));
    }

    // req.body.order = [{ songId, order }, ...]
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return next(new ErrorResponse("Order must be an array.", 400));
    }

    order.forEach(({ songId, order: newOrder }) => {
      const item = playlist.songs.find((s) => s.song.toString() === songId);
      if (item) item.order = newOrder;
    });

    playlist.songs.sort((a, b) => a.order - b.order);
    await playlist.save();

    res.status(200).json({ success: true, data: playlist });
  } catch (err) {
    next(err);
  }
};

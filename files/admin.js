const User = require("../models/User");
const Song = require("../models/Song");
const Playlist = require("../models/Playlist");
const ErrorResponse = require("../utils/ErrorResponse");
const path = require("path");
const fs = require("fs");

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get platform-wide statistics
// @route   GET /api/admin/stats
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalSongs,
      totalPlaylists,
      flaggedSongs,
      recentUsers,
      topSongs,
      genreBreakdown,
    ] = await Promise.all([
      User.countDocuments(),
      Song.countDocuments(),
      Playlist.countDocuments(),
      Song.countDocuments({ isFlagged: true }),
      User.find().sort("-createdAt").limit(5).select("username email role createdAt"),
      Song.find().sort("-playCount").limit(5).populate("uploadedBy", "username"),
      Song.aggregate([
        { $group: { _id: "$genre", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totals: { users: totalUsers, songs: totalSongs, playlists: totalPlaylists, flaggedSongs },
        recentUsers,
        topSongs,
        genreBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    let filter = {};
    if (req.query.search) {
      filter.$or = [
        { username: new RegExp(req.query.search, "i") },
        { email: new RegExp(req.query.search, "i") },
      ];
    }
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

    const [users, total] = await Promise.all([
      User.find(filter).sort("-createdAt").skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get a single user (admin view)
// @route   GET /api/admin/users/:id
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorResponse("User not found.", 404));

    const [songs, playlists] = await Promise.all([
      Song.find({ uploadedBy: user._id }).sort("-createdAt").limit(10),
      Playlist.find({ createdBy: user._id }).sort("-createdAt").limit(10),
    ]);

    res.status(200).json({ success: true, data: { user, songs, playlists } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Activate or deactivate a user account
// @route   PUT /api/admin/users/:id/status
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (isActive === undefined) {
      return next(new ErrorResponse("Please provide isActive value.", 400));
    }

    // Prevent admin from deactivating their own account
    if (req.params.id === req.user.id) {
      return next(new ErrorResponse("You cannot change your own account status.", 400));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!user) return next(new ErrorResponse("User not found.", 404));

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully.`,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return next(new ErrorResponse("Invalid role. Must be 'user' or 'admin'.", 400));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    if (!user) return next(new ErrorResponse("User not found.", 404));

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all flagged songs
// @route   GET /api/admin/songs/flagged
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getFlaggedSongs = async (req, res, next) => {
  try {
    const songs = await Song.find({ isFlagged: true })
      .populate("uploadedBy", "username email")
      .sort("-createdAt");

    res.status(200).json({ success: true, count: songs.length, data: songs });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Flag a song as inappropriate
// @route   PUT /api/admin/songs/:id/flag
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.flagSong = async (req, res, next) => {
  try {
    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { isFlagged: true, flagReason: req.body.reason || "Flagged by admin" },
      { new: true }
    );

    if (!song) return next(new ErrorResponse("Song not found.", 404));

    res.status(200).json({ success: true, data: song });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Unflag a song
// @route   PUT /api/admin/songs/:id/unflag
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.unflagSong = async (req, res, next) => {
  try {
    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { isFlagged: false, flagReason: null },
      { new: true }
    );

    if (!song) return next(new ErrorResponse("Song not found.", 404));

    res.status(200).json({ success: true, data: song });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin delete any song
// @route   DELETE /api/admin/songs/:id
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.adminDeleteSong = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return next(new ErrorResponse("Song not found.", 404));

    // Delete files from disk
    const audioPath = path.join(__dirname, "..", song.fileUrl);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

    if (song.thumbnailUrl) {
      const thumbPath = path.join(__dirname, "..", song.thumbnailUrl);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    }

    // Remove from playlists
    await Playlist.updateMany(
      { "songs.song": song._id },
      { $pull: { songs: { song: song._id } } }
    );

    await User.findByIdAndUpdate(song.uploadedBy, { $inc: { totalUploads: -1 } });
    await song.deleteOne();

    res.status(200).json({ success: true, message: "Song deleted by admin." });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all songs (admin view, includes private/flagged)
// @route   GET /api/admin/songs
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllSongs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    let filter = {};
    if (req.query.search) filter.$text = { $search: req.query.search };
    if (req.query.genre) filter.genre = req.query.genre;
    if (req.query.isFlagged !== undefined) filter.isFlagged = req.query.isFlagged === "true";

    const [songs, total] = await Promise.all([
      Song.find(filter)
        .sort("-createdAt")
        .skip(skip)
        .limit(limit)
        .populate("uploadedBy", "username email"),
      Song.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: songs.length,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      data: songs,
    });
  } catch (err) {
    next(err);
  }
};

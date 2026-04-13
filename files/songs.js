const path = require("path");
const fs = require("fs");
const Song = require("../models/Song");
const User = require("../models/User");
const Playlist = require("../models/Playlist");
const ErrorResponse = require("../utils/ErrorResponse");

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all songs (public + own private)
// @route   GET /api/songs
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getSongs = async (req, res, next) => {
  try {
    // advancedResults middleware already ran — just send it
    res.status(200).json(res.advancedResults);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get songs uploaded by the current user
// @route   GET /api/songs/my
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getMySongs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    let filter = { uploadedBy: req.user.id };

    // Optional search
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Optional genre filter
    if (req.query.genre) {
      filter.genre = req.query.genre;
    }

    const [songs, total] = await Promise.all([
      Song.find(filter)
        .sort("-createdAt")
        .skip(skip)
        .limit(limit)
        .populate("uploadedBy", "username avatar"),
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

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get a single song by ID
// @route   GET /api/songs/:id
// @access  Private / Public (if song.isPublic)
// ─────────────────────────────────────────────────────────────────────────────
exports.getSong = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id).populate(
      "uploadedBy",
      "username avatar"
    );

    if (!song) {
      return next(new ErrorResponse("Song not found.", 404));
    }

    // Only owner or admin can see private songs
    if (
      !song.isPublic &&
      (!req.user ||
        (song.uploadedBy._id.toString() !== req.user.id &&
          req.user.role !== "admin"))
    ) {
      return next(new ErrorResponse("This song is private.", 403));
    }

    res.status(200).json({ success: true, data: song });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Upload a new song
// @route   POST /api/songs
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadSong = async (req, res, next) => {
  try {
    if (!req.files || !req.files.audio) {
      return next(new ErrorResponse("Please upload an audio file.", 400));
    }

    const audioFile = req.files.audio[0];
    const { title, artist, album, genre, year, lyrics, tags, isPublic } = req.body;

    // Build song document
    const songData = {
      title: title || path.parse(audioFile.originalname).name,
      artist: artist || "Unknown Artist",
      album: album || "Unknown Album",
      genre: genre || "Other",
      year: year ? parseInt(year) : undefined,
      lyrics: lyrics || "",
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim())) : [],
      isPublic: isPublic === "true" || isPublic === true,
      uploadedBy: req.user.id,
      fileName: audioFile.filename,
      fileUrl: `/uploads/audio/${audioFile.filename}`,
      fileSize: audioFile.size,
      mimeType: audioFile.mimetype,
    };

    // Attach thumbnail if uploaded
    if (req.files.thumbnail && req.files.thumbnail[0]) {
      const thumb = req.files.thumbnail[0];
      songData.thumbnailUrl = `/uploads/thumbnails/${thumb.filename}`;
    }

    const song = await Song.create(songData);

    // Increment user upload count
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalUploads: 1 } });

    res.status(201).json({ success: true, data: song });
  } catch (err) {
    // Clean up uploaded files if song creation failed
    if (req.files) {
      Object.values(req.files).forEach((fileArr) => {
        fileArr.forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update song metadata
// @route   PUT /api/songs/:id
// @access  Private (owner or admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateSong = async (req, res, next) => {
  try {
    let song = await Song.findById(req.params.id);

    if (!song) {
      return next(new ErrorResponse("Song not found.", 404));
    }

    // Only owner or admin can update
    if (
      song.uploadedBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(new ErrorResponse("Not authorized to update this song.", 403));
    }

    const allowedFields = [
      "title", "artist", "album", "genre", "year",
      "lyrics", "tags", "isPublic",
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Update thumbnail if new one uploaded
    if (req.file) {
      // Delete old thumbnail
      if (song.thumbnailUrl) {
        const oldPath = path.join(__dirname, "..", song.thumbnailUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;
    }

    song = await Song.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: song });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a song
// @route   DELETE /api/songs/:id
// @access  Private (owner or admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteSong = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return next(new ErrorResponse("Song not found.", 404));
    }

    if (
      song.uploadedBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(new ErrorResponse("Not authorized to delete this song.", 403));
    }

    // Delete audio file from disk
    const audioPath = path.join(__dirname, "..", song.fileUrl);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

    // Delete thumbnail from disk
    if (song.thumbnailUrl) {
      const thumbPath = path.join(__dirname, "..", song.thumbnailUrl);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    }

    // Remove song from all playlists
    await Playlist.updateMany(
      { "songs.song": song._id },
      { $pull: { songs: { song: song._id } } }
    );

    await song.deleteOne();

    // Decrement user upload count
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalUploads: -1 } });

    res.status(200).json({ success: true, message: "Song deleted successfully." });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Stream audio file
// @route   GET /api/songs/:id/stream
// @access  Private / Public
// ─────────────────────────────────────────────────────────────────────────────
exports.streamSong = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return next(new ErrorResponse("Song not found.", 404));
    }

    // Check access
    if (!song.isPublic) {
      if (!req.user || song.uploadedBy.toString() !== req.user.id) {
        return next(new ErrorResponse("This song is private.", 403));
      }
    }

    const filePath = path.join(__dirname, "..", song.fileUrl);

    if (!fs.existsSync(filePath)) {
      return next(new ErrorResponse("Audio file not found on server.", 404));
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Increment play count (fire-and-forget)
    Song.findByIdAndUpdate(song._id, { $inc: { playCount: 1 } }).exec();

    if (range) {
      // ─── Range request (seek support) ─────────────────────────────────────
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": song.mimeType || "audio/mpeg",
      });

      fileStream.pipe(res);
    } else {
      // ─── Full file ────────────────────────────────────────────────────────
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": song.mimeType || "audio/mpeg",
        "Accept-Ranges": "bytes",
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Search songs
// @route   GET /api/songs/search
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.searchSongs = async (req, res, next) => {
  try {
    const { q, genre, artist, page = 1, limit = 20 } = req.query;

    if (!q && !genre && !artist) {
      return next(new ErrorResponse("Please provide a search query.", 400));
    }

    const filter = { isPublic: true };

    if (q) {
      filter.$text = { $search: q };
    }
    if (genre) filter.genre = genre;
    if (artist) filter.artist = new RegExp(artist, "i");

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [songs, total] = await Promise.all([
      Song.find(filter)
        .sort(q ? { score: { $meta: "textScore" } } : "-createdAt")
        .select(q ? { score: { $meta: "textScore" } } : {})
        .skip(skip)
        .limit(parseInt(limit))
        .populate("uploadedBy", "username avatar"),
      Song.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: songs.length,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      data: songs,
    });
  } catch (err) {
    next(err);
  }
};

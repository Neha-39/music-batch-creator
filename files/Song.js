const mongoose = require("mongoose");

const SongSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Song title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    artist: {
      type: String,
      required: [true, "Artist name is required"],
      trim: true,
      maxlength: [100, "Artist name cannot exceed 100 characters"],
    },
    album: {
      type: String,
      trim: true,
      maxlength: [100, "Album name cannot exceed 100 characters"],
      default: "Unknown Album",
    },
    genre: {
      type: String,
      enum: [
        "Pop", "Rock", "Hip-Hop", "Jazz", "Classical", "Electronic",
        "R&B", "Country", "Metal", "Folk", "Reggae", "Blues",
        "Soul", "Funk", "Indie", "Alternative", "Ambient", "Other",
      ],
      default: "Other",
    },
    year: {
      type: Number,
      min: [1900, "Year must be after 1900"],
      max: [new Date().getFullYear(), "Year cannot be in the future"],
      default: null,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number, // in bytes
      default: 0,
    },
    mimeType: {
      type: String,
      default: "audio/mpeg",
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    lyrics: {
      type: String,
      default: "",
      maxlength: [10000, "Lyrics cannot exceed 10000 characters"],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: null,
    },
    playCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes for fast searching ────────────────────────────────────────────────
SongSchema.index({ title: "text", artist: "text", album: "text", tags: "text" });
SongSchema.index({ genre: 1 });
SongSchema.index({ uploadedBy: 1 });
SongSchema.index({ createdAt: -1 });
SongSchema.index({ playCount: -1 });

// ─── Virtual: formatted duration ───────────────────────────────────────────────
SongSchema.virtual("durationFormatted").get(function () {
  if (!this.duration) return "0:00";
  const mins = Math.floor(this.duration / 60);
  const secs = Math.floor(this.duration % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
});

// ─── Virtual: formatted file size ─────────────────────────────────────────────
SongSchema.virtual("fileSizeFormatted").get(function () {
  if (!this.fileSize) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
  return `${(this.fileSize / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
});

module.exports = mongoose.model("Song", SongSchema);

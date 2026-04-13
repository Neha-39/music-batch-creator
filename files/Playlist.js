const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const PlaylistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Playlist name is required"],
      trim: true,
      maxlength: [80, "Playlist name cannot exceed 80 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    coverImage: {
      type: String,
      default: null,
    },
    songs: [
      {
        song: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Song",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    // Unique share token for public/private link sharing
    shareToken: {
      type: String,
      unique: true,
      default: () => uuidv4(),
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    genre: {
      type: String,
      default: "Mixed",
    },
    playCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
PlaylistSchema.index({ name: "text", description: "text" });
PlaylistSchema.index({ createdBy: 1 });
PlaylistSchema.index({ shareToken: 1 });
PlaylistSchema.index({ isPublic: 1, createdAt: -1 });

// ─── Virtual: total song count ─────────────────────────────────────────────────
PlaylistSchema.virtual("songCount").get(function () {
  return this.songs ? this.songs.length : 0;
});

// ─── Virtual: total duration ───────────────────────────────────────────────────
PlaylistSchema.virtual("totalDuration").get(function () {
  // Requires songs to be populated with duration field
  if (!this.songs || !this.songs.length) return 0;
  return this.songs.reduce((total, item) => {
    return total + (item.song?.duration || 0);
  }, 0);
});

// ─── Virtual: share URL ────────────────────────────────────────────────────────
PlaylistSchema.virtual("shareUrl").get(function () {
  return `${process.env.CLIENT_URL}/playlist/share/${this.shareToken}`;
});

// ─── Middleware: Regenerate share token if toggled to public ───────────────────
PlaylistSchema.pre("save", function (next) {
  if (this.isModified("isPublic") && this.isPublic && !this.shareToken) {
    this.shareToken = uuidv4();
  }
  next();
});

module.exports = mongoose.model("Playlist", PlaylistSchema);

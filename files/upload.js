const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const ErrorResponse = require("../utils/ErrorResponse");

// ─── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",       // .mp3
  "audio/mp4",        // .m4a
  "audio/wav",        // .wav
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",        // .ogg
  "audio/flac",       // .flac
  "audio/aac",        // .aac
  "audio/webm",       // .webm
];

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

// ─── Audio Storage ─────────────────────────────────────────────────────────────
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.FILE_UPLOAD_PATH || "./uploads/audio");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// ─── Image/Thumbnail Storage ───────────────────────────────────────────────────
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.THUMBNAIL_PATH || "./uploads/thumbnails");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `thumb_${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// ─── File Filters ──────────────────────────────────────────────────────────────
const audioFilter = (req, file, cb) => {
  if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ErrorResponse(
        `Unsupported audio format '${file.mimetype}'. Allowed: MP3, WAV, FLAC, AAC, OGG, M4A.`,
        400
      ),
      false
    );
  }
};

const imageFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ErrorResponse(
        `Unsupported image format. Allowed: JPEG, PNG, WebP, GIF.`,
        400
      ),
      false
    );
  }
};

// ─── Multer Instances ──────────────────────────────────────────────────────────

/** Upload a single audio file (field: "audio") */
exports.uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_UPLOAD) || 50 * 1024 * 1024 },
  fileFilter: audioFilter,
}).single("audio");

/** Upload a single thumbnail image (field: "thumbnail") */
exports.uploadThumbnail = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for images
  fileFilter: imageFilter,
}).single("thumbnail");

/** Upload both audio and thumbnail at once */
exports.uploadSongWithThumbnail = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "audio") {
        cb(null, process.env.FILE_UPLOAD_PATH || "./uploads/audio");
      } else {
        cb(null, process.env.THUMBNAIL_PATH || "./uploads/thumbnails");
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const prefix = file.fieldname === "audio" ? "" : "thumb_";
      cb(null, `${prefix}${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: parseInt(process.env.MAX_FILE_UPLOAD) || 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "audio") {
      audioFilter(req, file, cb);
    } else if (file.fieldname === "thumbnail") {
      imageFilter(req, file, cb);
    } else {
      cb(new ErrorResponse("Unexpected field.", 400), false);
    }
  },
}).fields([
  { name: "audio", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

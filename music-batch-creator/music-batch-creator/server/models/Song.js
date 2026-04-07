const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      default: 'Unknown Artist',
      trim: true,
    },
    filename: {
      type: String,
      required: true,
    },
    filepath: {
      type: String,
      required: true,
    },
    size: {
      type: Number, // file size in bytes
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Song', songSchema);

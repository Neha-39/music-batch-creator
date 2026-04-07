const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Song = require('../models/Song');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure Multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create uploads folder if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp + original name
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// Only allow audio files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// POST /api/songs/upload — Upload a song
router.post('/upload', authMiddleware, upload.single('song'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { title, artist } = req.body;

    const song = new Song({
      title: title || req.file.originalname.replace(/\.[^/.]+$/, ''), // Remove extension if no title
      artist: artist || 'Unknown Artist',
      filename: req.file.filename,
      filepath: `/uploads/${req.file.filename}`,
      size: req.file.size,
      uploadedBy: req.user.id,
    });

    await song.save();

    res.status(201).json({ message: 'Song uploaded successfully!', song });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error uploading song.' });
  }
});

// GET /api/songs — Get all songs for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const songs = await Song.find({ uploadedBy: req.user.id }).sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching songs.' });
  }
});

// DELETE /api/songs/:id — Delete a song
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const song = await Song.findOne({ _id: req.params.id, uploadedBy: req.user.id });

    if (!song) {
      return res.status(404).json({ message: 'Song not found.' });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '../uploads', song.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await song.deleteOne();

    res.json({ message: 'Song deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting song.' });
  }
});

module.exports = router;

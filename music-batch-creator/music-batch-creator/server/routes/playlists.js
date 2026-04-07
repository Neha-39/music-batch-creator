const express = require('express');
const Playlist = require('../models/Playlist');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/playlists — Create a new playlist
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Playlist name is required.' });
    }

    const playlist = new Playlist({
      name,
      description: description || '',
      songs: [],
      createdBy: req.user.id,
    });

    await playlist.save();

    res.status(201).json({ message: 'Playlist created!', playlist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating playlist.' });
  }
});

// GET /api/playlists — Get all playlists for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const playlists = await Playlist.find({ createdBy: req.user.id })
      .populate('songs') // Include full song details
      .sort({ createdAt: -1 });

    res.json(playlists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching playlists.' });
  }
});

// GET /api/playlists/:id — Get a single playlist
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    }).populate('songs');

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found.' });
    }

    res.json(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching playlist.' });
  }
});

// POST /api/playlists/:id/songs — Add a song to a playlist
router.post('/:id/songs', authMiddleware, async (req, res) => {
  try {
    const { songId } = req.body;

    const playlist = await Playlist.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found.' });
    }

    // Avoid duplicates
    if (playlist.songs.includes(songId)) {
      return res.status(400).json({ message: 'Song already in playlist.' });
    }

    playlist.songs.push(songId);
    await playlist.save();

    const updated = await Playlist.findById(playlist._id).populate('songs');
    res.json({ message: 'Song added to playlist!', playlist: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding song to playlist.' });
  }
});

// DELETE /api/playlists/:id/songs/:songId — Remove a song from a playlist
router.delete('/:id/songs/:songId', authMiddleware, async (req, res) => {
  try {
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found.' });
    }

    playlist.songs = playlist.songs.filter(
      (s) => s.toString() !== req.params.songId
    );
    await playlist.save();

    const updated = await Playlist.findById(playlist._id).populate('songs');
    res.json({ message: 'Song removed from playlist.', playlist: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error removing song.' });
  }
});

// DELETE /api/playlists/:id — Delete a playlist
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const playlist = await Playlist.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found.' });
    }

    res.json({ message: 'Playlist deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting playlist.' });
  }
});

module.exports = router;

/**
 * Database Seeder
 * Run with: npm run seed
 * To clear DB:  node utils/seeder.js --delete
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Song = require("../models/Song");
const Playlist = require("../models/Playlist");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB Connected for seeding");
};

// ─── Sample Data ───────────────────────────────────────────────────────────────

const sampleUsers = [
  {
    username: "admin",
    email: "admin@musicbatch.dev",
    password: "Admin1234",
    role: "admin",
    bio: "Platform administrator",
    emailVerified: true,
    isActive: true,
  },
  {
    username: "neha_music",
    email: "neha@example.com",
    password: "Neha1234",
    role: "user",
    bio: "Music enthusiast & playlist curator 🎵",
    emailVerified: true,
    isActive: true,
  },
  {
    username: "beatmaster",
    email: "beats@example.com",
    password: "Beats1234",
    role: "user",
    bio: "Producer & DJ",
    emailVerified: true,
    isActive: true,
  },
];

const sampleSongs = [
  {
    title: "Midnight Drive",
    artist: "The Neon Collective",
    album: "City Lights",
    genre: "Electronic",
    year: 2023,
    duration: 214,
    fileUrl: "/uploads/audio/sample_1.mp3",
    fileName: "sample_1.mp3",
    fileSize: 3407872,
    mimeType: "audio/mpeg",
    isPublic: true,
    tags: ["chill", "electronic", "night"],
  },
  {
    title: "Golden Hour",
    artist: "Serene Waves",
    album: "Horizons",
    genre: "Indie",
    year: 2023,
    duration: 187,
    fileUrl: "/uploads/audio/sample_2.mp3",
    fileName: "sample_2.mp3",
    fileSize: 2985984,
    mimeType: "audio/mpeg",
    isPublic: true,
    tags: ["indie", "mellow", "sunset"],
  },
  {
    title: "Urban Rhythm",
    artist: "Cityscapes",
    album: "Metro Pulse",
    genre: "Hip-Hop",
    year: 2024,
    duration: 198,
    fileUrl: "/uploads/audio/sample_3.mp3",
    fileName: "sample_3.mp3",
    fileSize: 3162112,
    mimeType: "audio/mpeg",
    isPublic: true,
    tags: ["hip-hop", "urban", "beats"],
  },
  {
    title: "Rainy Day Jazz",
    artist: "Blue Note Quartet",
    album: "Cafe Sessions",
    genre: "Jazz",
    year: 2022,
    duration: 322,
    fileUrl: "/uploads/audio/sample_4.mp3",
    fileName: "sample_4.mp3",
    fileSize: 5144576,
    mimeType: "audio/mpeg",
    isPublic: true,
    tags: ["jazz", "relaxing", "rain"],
  },
  {
    title: "Neon Pulse",
    artist: "SynthWave Studios",
    album: "Retro Future",
    genre: "Electronic",
    year: 2024,
    duration: 245,
    fileUrl: "/uploads/audio/sample_5.mp3",
    fileName: "sample_5.mp3",
    fileSize: 3915776,
    mimeType: "audio/mpeg",
    isPublic: true,
    tags: ["synthwave", "80s", "electronic"],
  },
  {
    title: "Mountain Echo",
    artist: "Acoustic Wanderers",
    album: "Trails & Peaks",
    genre: "Folk",
    year: 2023,
    duration: 278,
    fileUrl: "/uploads/audio/sample_6.mp3",
    fileName: "sample_6.mp3",
    fileSize: 4440064,
    mimeType: "audio/mpeg",
    isPublic: true,
    tags: ["folk", "acoustic", "nature"],
  },
];

// ─── Import Data ───────────────────────────────────────────────────────────────
const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Song.deleteMany();
    await Playlist.deleteMany();

    console.log("🧹 Cleared existing data");

    // Create users (passwords will be hashed via pre-save hook)
    const createdUsers = await User.create(sampleUsers);
    console.log(`👤 Created ${createdUsers.length} users`);

    const adminUser = createdUsers[0];
    const regularUser = createdUsers[1];
    const beatUser = createdUsers[2];

    // Assign songs to users
    const songsWithUsers = sampleSongs.map((song, idx) => ({
      ...song,
      uploadedBy: idx < 3 ? regularUser._id : beatUser._id,
    }));

    const createdSongs = await Song.create(songsWithUsers);
    console.log(`🎵 Created ${createdSongs.length} songs`);

    // Update user upload counts
    await User.findByIdAndUpdate(regularUser._id, { totalUploads: 3 });
    await User.findByIdAndUpdate(beatUser._id, { totalUploads: 3 });

    // Create sample playlists
    const samplePlaylists = [
      {
        name: "Chill Vibes Mix",
        description: "Perfect background music for studying or relaxing",
        isPublic: true,
        genre: "Mixed",
        tags: ["chill", "study", "background"],
        createdBy: regularUser._id,
        songs: [
          { song: createdSongs[0]._id, order: 0 },
          { song: createdSongs[1]._id, order: 1 },
          { song: createdSongs[3]._id, order: 2 },
        ],
      },
      {
        name: "Late Night Drives",
        description: "Electronic beats for the midnight road",
        isPublic: true,
        genre: "Electronic",
        tags: ["electronic", "night", "drive"],
        createdBy: regularUser._id,
        songs: [
          { song: createdSongs[0]._id, order: 0 },
          { song: createdSongs[4]._id, order: 1 },
        ],
      },
      {
        name: "Urban Beats Collection",
        description: "Hip-hop and urban sounds",
        isPublic: true,
        genre: "Hip-Hop",
        tags: ["hip-hop", "urban"],
        createdBy: beatUser._id,
        songs: [
          { song: createdSongs[2]._id, order: 0 },
          { song: createdSongs[4]._id, order: 1 },
        ],
      },
    ];

    const createdPlaylists = await Playlist.create(samplePlaylists);
    console.log(`📋 Created ${createdPlaylists.length} playlists`);

    // Update playlist counts
    await User.findByIdAndUpdate(regularUser._id, { totalPlaylists: 2 });
    await User.findByIdAndUpdate(beatUser._id, { totalPlaylists: 1 });

    console.log("\n✅ Seed data imported successfully!\n");
    console.log("─── Login Credentials ──────────────────────");
    console.log(`Admin:   admin@musicbatch.dev  /  Admin1234`);
    console.log(`User 1:  neha@example.com      /  Neha1234`);
    console.log(`User 2:  beats@example.com     /  Beats1234`);
    console.log("────────────────────────────────────────────\n");

    process.exit(0);
  } catch (err) {
    console.error(`❌ Seed error: ${err.message}`);
    process.exit(1);
  }
};

// ─── Delete Data ───────────────────────────────────────────────────────────────
const deleteData = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await Song.deleteMany();
    await Playlist.deleteMany();
    console.log("🗑️  All data deleted.");
    process.exit(0);
  } catch (err) {
    console.error(`❌ Delete error: ${err.message}`);
    process.exit(1);
  }
};

// ─── Entry Point ───────────────────────────────────────────────────────────────
if (process.argv[2] === "--delete") {
  deleteData();
} else {
  importData();
}

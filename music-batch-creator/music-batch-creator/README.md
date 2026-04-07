# 🎵 Music Batch Creator

A simple full-stack web app to upload, manage, and organize music files into playlists.

---

## 📁 Folder Structure

```
music-batch-creator/
├── client/                    # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── Dashboard.js
│   │   │   ├── SongsTab.js
│   │   │   └── PlaylistsTab.js
│   │   ├── api.js             # Axios API helpers
│   │   ├── App.js             # Routing & auth state
│   │   ├── index.js
│   │   └── index.css          # Global styles
│   └── package.json
│
├── server/                    # Node.js + Express backend
│   ├── middleware/
│   │   └── auth.js            # JWT auth middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Song.js
│   │   └── Playlist.js
│   ├── routes/
│   │   ├── auth.js            # /api/auth/register, /login
│   │   ├── songs.js           # /api/songs
│   │   └── playlists.js       # /api/playlists
│   ├── uploads/               # Uploaded audio files stored here
│   ├── server.js              # Entry point
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Tech Stack

| Layer          | Technology              |
|----------------|-------------------------|
| Frontend       | React, React Router v6  |
| Backend        | Node.js, Express        |
| Database       | MongoDB (Mongoose)      |
| Auth           | JWT (JSON Web Tokens)   |
| File Upload    | Multer (local storage)  |
| HTTP Client    | Axios                   |

---

## ⚙️ Prerequisites

Make sure you have these installed:

- [Node.js](https://nodejs.org/) v16 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) URI

---

## 🛠️ Steps to Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/music-batch-creator.git
cd music-batch-creator
```

### 2. Set Up the Server

```bash
cd server
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/musicbatchcreator
JWT_SECRET=your_super_secret_key_here
```

Start the backend:

```bash
npm run dev       # with nodemon (auto-restarts on change)
# OR
npm start         # plain node
```

You should see:
```
Connected to MongoDB
Server running on port 5000
```

### 3. Set Up the Client

Open a **new terminal**:

```bash
cd client
npm install
npm start
```

The React app will open at **http://localhost:3000**

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| POST   | /api/auth/register   | Register new user   |
| POST   | /api/auth/login      | Login user          |

### Songs
| Method | Endpoint             | Description              |
|--------|----------------------|--------------------------|
| GET    | /api/songs           | Get all songs (auth)     |
| POST   | /api/songs/upload    | Upload a song (auth)     |
| DELETE | /api/songs/:id       | Delete a song (auth)     |

### Playlists
| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| GET    | /api/playlists                  | Get all playlists (auth)       |
| POST   | /api/playlists                  | Create a playlist (auth)       |
| DELETE | /api/playlists/:id              | Delete a playlist (auth)       |
| POST   | /api/playlists/:id/songs        | Add a song to playlist (auth)  |
| DELETE | /api/playlists/:id/songs/:sid   | Remove song from playlist      |

---

## ✨ Features

- **Register & Login** — JWT-based authentication
- **Upload Songs** — Supports MP3, WAV, OGG, FLAC, AAC (up to 50MB)
- **Song Library** — View and delete your uploaded songs
- **Audio Player** — Play songs directly in the browser with a fixed player bar
- **Playlists** — Create playlists and add/remove songs
- **Private Data** — Each user only sees their own songs and playlists

---

## 📌 Notes

- Uploaded audio files are stored in `server/uploads/` on disk
- Files in `uploads/` are excluded from git (see `.gitignore`)
- For production, consider using cloud storage (AWS S3, Cloudinary, etc.)
- Passwords are hashed with `bcryptjs` before saving to MongoDB

---

## 📄 License

MIT — free to use and modify.

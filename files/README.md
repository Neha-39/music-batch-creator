# 🎵 Music Batch Creator — Backend API

A production-ready Node.js/Express REST API for the Music Batch Creator application.

---

## 📁 Project Structure

```
server/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── auth.js                # Register, login, password reset
│   ├── songs.js               # Upload, stream, CRUD, search
│   ├── playlists.js           # Playlist management
│   └── admin.js               # Admin panel operations
├── middleware/
│   ├── auth.js                # JWT protect + role authorization
│   ├── error.js               # Global error handler
│   ├── upload.js              # Multer audio/image upload
│   └── advancedResults.js     # Filtering, sorting, pagination
├── models/
│   ├── User.js                # User schema + JWT methods
│   ├── Song.js                # Song schema + text indexes
│   └── Playlist.js            # Playlist schema + share token
├── routes/
│   ├── auth.js                # /api/auth/*
│   ├── songs.js               # /api/songs/*
│   ├── playlists.js           # /api/playlists/*
│   └── admin.js               # /api/admin/*
├── utils/
│   ├── ErrorResponse.js       # Custom error class
│   ├── sendTokenResponse.js   # JWT cookie helper
│   ├── sendEmail.js           # Nodemailer + email templates
│   └── seeder.js              # Database seeder
├── uploads/
│   ├── audio/                 # Uploaded audio files
│   └── thumbnails/            # Uploaded images
├── .env.example               # Environment template
├── server.js                  # Entry point
└── package.json
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` with your MongoDB URI, JWT secret, and SMTP credentials.

### 3. Seed Sample Data (Optional)
```bash
npm run seed
```
Creates 3 users, 6 songs, and 3 playlists. Login credentials printed in terminal.

### 4. Start Development Server
```bash
npm run dev
```
Server runs at `http://localhost:5000`

### 5. Start Production Server
```bash
npm start
```

---

## 🔌 API Endpoints

### Auth  `/api/auth`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login | Public |
| GET | `/logout` | Logout | Private |
| GET | `/me` | Get current user | Private |
| PUT | `/updateprofile` | Update profile | Private |
| PUT | `/updatepassword` | Change password | Private |
| POST | `/forgotpassword` | Send reset email | Public |
| PUT | `/resetpassword/:token` | Reset password | Public |
| GET | `/verifyemail/:token` | Verify email | Public |

### Songs  `/api/songs`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List public songs | Private |
| GET | `/my` | My uploaded songs | Private |
| GET | `/search` | Search songs | Private |
| POST | `/` | Upload song | Private |
| GET | `/:id` | Get song | Optional |
| PUT | `/:id` | Update song | Private (owner) |
| DELETE | `/:id` | Delete song | Private (owner) |
| GET | `/:id/stream` | Stream audio | Optional |

### Playlists  `/api/playlists`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List public playlists | Private |
| GET | `/my` | My playlists | Private |
| GET | `/share/:token` | Access shared playlist | Public |
| POST | `/` | Create playlist | Private |
| GET | `/:id` | Get playlist | Optional |
| PUT | `/:id` | Update playlist | Private (owner) |
| DELETE | `/:id` | Delete playlist | Private (owner) |
| POST | `/:id/songs` | Add song | Private (owner) |
| DELETE | `/:id/songs/:songId` | Remove song | Private (owner) |
| PUT | `/:id/reorder` | Reorder songs | Private (owner) |

### Admin  `/api/admin`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/stats` | Dashboard stats | Admin |
| GET | `/users` | All users | Admin |
| GET | `/users/:id` | User detail | Admin |
| PUT | `/users/:id/status` | Activate/deactivate | Admin |
| PUT | `/users/:id/role` | Change role | Admin |
| GET | `/songs` | All songs | Admin |
| GET | `/songs/flagged` | Flagged songs | Admin |
| PUT | `/songs/:id/flag` | Flag song | Admin |
| PUT | `/songs/:id/unflag` | Unflag song | Admin |
| DELETE | `/songs/:id` | Delete any song | Admin |

---

## 🔑 Authentication

All protected routes require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```
Or via the `token` cookie (set automatically on login).

---

## 📤 File Upload

- Audio: `multipart/form-data` with field `audio`
- Thumbnail: field `thumbnail` (optional)
- Max audio size: **50MB** (configurable via `MAX_FILE_UPLOAD`)
- Supported formats: MP3, WAV, FLAC, AAC, OGG, M4A

---

## 🔍 Query Parameters (List endpoints)

All list endpoints support:
- `?search=` — full-text search
- `?genre=` — filter by genre
- `?sort=-createdAt` — sort (prefix `-` for descending)
- `?page=1&limit=20` — pagination
- `?select=title,artist` — field selection

---

## 🌐 Health Check
```
GET http://localhost:5000/api/health
```

---

## 🛡️ Security Features
- JWT authentication with httpOnly cookies
- bcrypt password hashing (12 rounds)
- Rate limiting on auth & global routes
- MongoDB query sanitization
- Helmet security headers
- Input validation with express-validator
- Role-based access control (user / admin)

---

## 🗄️ Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 6.0 (local or Atlas)
- SMTP credentials (Mailtrap for dev, SendGrid/SES for prod)

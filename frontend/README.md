# 🎵 Music Batch Creator — Frontend (React)

A production-ready React frontend for the Music Batch Creator application.

---

## 📁 Project Structure

```
client/
├── public/
│   └── index.html               # Google Fonts (Syne + DM Sans)
├── src/
│   ├── context/
│   │   ├── AuthContext.js       # Global auth state (login/logout/register)
│   │   └── PlayerContext.js     # Global audio player (queue, seek, shuffle, repeat)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.js       # Navigation sidebar
│   │   │   └── Sidebar.css
│   │   ├── player/
│   │   │   ├── PlayerBar.js     # Bottom audio player bar
│   │   │   └── Player.css
│   │   ├── songs/
│   │   │   ├── SongRow.js       # Song list row with context menu
│   │   │   └── SongRow.css
│   │   └── playlists/
│   │       ├── PlaylistCard.js  # Playlist grid card
│   │       └── PlaylistCard.css
│   ├── pages/
│   │   ├── LoginPage.js         # Sign in
│   │   ├── RegisterPage.js      # Create account
│   │   ├── PasswordPages.js     # Forgot / reset password
│   │   ├── DashboardPage.js     # Home dashboard
│   │   ├── SongsPage.js         # My songs library
│   │   ├── UploadPage.js        # Upload / edit songs
│   │   ├── PlaylistsPage.js     # Playlist grid + create modal
│   │   ├── PlaylistDetailPage.js# Playlist view with song management
│   │   ├── SearchPage.js        # Search public library
│   │   └── AdminPage.js         # Admin panel (stats, users, moderation)
│   ├── api.js                   # Axios API layer
│   ├── App.js                   # Router + layout + route guards
│   ├── index.js                 # React entry point
│   └── index.css                # Global styles & design tokens
└── package.json
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Configure Environment (optional)
Create a `.env` file in the `client/` directory:
```
REACT_APP_API_URL=http://localhost:5000/api
```
If omitted, defaults to `http://localhost:5000/api`.

### 3. Start Development Server
```bash
npm start
```
App runs at `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
```

---

## 🎨 Design System

**Fonts:** Syne (display/headings) + DM Sans (body)  
**Theme:** Dark editorial — deep blacks, warm text, gold accent  
**Color tokens** (defined in `index.css`):

| Token | Value | Usage |
|-------|-------|-------|
| `--gold` | `#f5a623` | Primary accent, CTAs |
| `--bg-base` | `#0c0c0c` | Page background |
| `--bg-surface` | `#141414` | Cards, sidebar |
| `--text-primary` | `#f0ece4` | Main text |

---

## 🧭 Pages & Routes

| Route | Page | Access |
|-------|------|--------|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/forgot-password` | Forgot Password | Public |
| `/reset-password/:token` | Reset Password | Public |
| `/dashboard` | Dashboard | Protected |
| `/songs` | My Songs | Protected |
| `/upload` | Upload / Edit Song | Protected |
| `/playlists` | My Playlists | Protected |
| `/playlists/:id` | Playlist Detail | Protected |
| `/search` | Search | Protected |
| `/admin` | Admin Panel | Admin only |
| `/playlist/share/:token` | Shared Playlist | Public |

---

## 🎵 Features

- **Authentication** — Login, Register, Forgot/Reset password with route guards
- **Dashboard** — Personalized greeting, stats, recent songs and playlists
- **Song Library** — List, filter by genre, search, play, edit, delete
- **Upload** — Drag-and-drop audio, thumbnail upload, metadata form with progress bar
- **Playlists** — Create/edit/delete, add/remove songs, public/private toggle
- **Share** — Copy shareable playlist link to clipboard
- **Search** — Full-text search across public library
- **Audio Player** — Queue, seek bar, shuffle, repeat, volume control, range streaming
- **Admin Panel** — Stats dashboard, user management, song moderation, flagged content

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `react-router-dom` | Client-side routing |
| `axios` | HTTP requests with interceptors |
| `react-hot-toast` | Notification toasts |
| `react-icons` | Material Design icon set |

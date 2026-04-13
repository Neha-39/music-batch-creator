import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MdCloudUpload, MdAudiotrack, MdImage, MdClose, MdCheck } from 'react-icons/md';
import { songsAPI } from '../api';
import toast from 'react-hot-toast';
import './UploadPage.css';

const GENRES = ['Pop','Rock','Hip-Hop','Jazz','Classical','Electronic','R&B','Country','Metal','Folk','Reggae','Blues','Soul','Indie','Alternative','Ambient','Other'];

const defaultForm = {
  title: '', artist: '', album: '', genre: 'Other',
  year: '', lyrics: '', tags: '', isPublic: true,
};

export default function UploadPage() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const editId          = searchParams.get('edit');

  const audioRef     = useRef();
  const thumbRef     = useRef();

  const [form, setForm]           = useState(defaultForm);
  const [audioFile, setAudioFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone]           = useState(false);
  const [dragOver, setDragOver]   = useState(false);

  // Load existing song for editing
  useEffect(() => {
    if (!editId) return;
    songsAPI.getOne(editId)
      .then(({ data }) => {
        const s = data.data;
        setForm({
          title: s.title, artist: s.artist, album: s.album || '',
          genre: s.genre, year: s.year || '', lyrics: s.lyrics || '',
          tags: s.tags?.join(', ') || '', isPublic: s.isPublic,
        });
        if (s.thumbnailUrl) setThumbPreview(`http://localhost:5000${s.thumbnailUrl}`);
      })
      .catch(() => toast.error('Could not load song data'));
  }, [editId]);

  const handleAudioDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) return toast.error('Please select an audio file');
    setAudioFile(file);
    if (!form.title) {
      setForm(p => ({ ...p, title: file.name.replace(/\.[^.]+$/, '') }));
    }
  };

  const handleThumbChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image');
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editId && !audioFile) return toast.error('Please select an audio file');
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.artist.trim()) return toast.error('Artist is required');

    const fd = new FormData();
    if (audioFile) fd.append('audio', audioFile);
    if (thumbFile) fd.append('thumbnail', thumbFile);
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));

    setUploading(true);
    setProgress(0);

    try {
      const onProgress = (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      if (editId) {
        await songsAPI.update(editId, fd);
        toast.success('Song updated!');
      } else {
        await songsAPI.upload(fd, onProgress);
        toast.success('Song uploaded! 🎵');
      }
      setDone(true);
      setTimeout(() => navigate('/songs'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
      setUploading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        disabled={uploading}
      />
    </div>
  );

  if (done) return (
    <div className="page upload-done">
      <div className="upload-done__icon"><MdCheck /></div>
      <h2>{editId ? 'Song updated!' : 'Upload complete!'}</h2>
      <p>Redirecting to your library…</p>
    </div>
  );

  return (
    <div className="page upload-page">
      <div className="page-header">
        <h1 className="page-title">{editId ? 'Edit Song' : 'Upload Music'}</h1>
        <p className="page-subtitle">{editId ? 'Update song metadata' : 'Add new tracks to your library'}</p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="upload-left">
          {/* Audio drop zone */}
          {!editId && (
            <div
              className={`upload-dropzone${audioFile ? ' has-file' : ''}${dragOver ? ' drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleAudioDrop}
              onClick={() => audioRef.current?.click()}
            >
              <input ref={audioRef} type="file" accept="audio/*" hidden onChange={handleAudioDrop} />
              {audioFile ? (
                <>
                  <MdAudiotrack className="upload-dropzone__icon active" />
                  <div className="upload-dropzone__name">{audioFile.name}</div>
                  <div className="upload-dropzone__size">
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <button
                    type="button"
                    className="upload-dropzone__remove"
                    onClick={e => { e.stopPropagation(); setAudioFile(null); }}
                  >
                    <MdClose /> Remove
                  </button>
                </>
              ) : (
                <>
                  <MdCloudUpload className="upload-dropzone__icon" />
                  <div className="upload-dropzone__label">
                    Drop audio file here or <span>browse</span>
                  </div>
                  <div className="upload-dropzone__hint">
                    MP3, WAV, FLAC, AAC, OGG · Max 50MB
                  </div>
                </>
              )}
            </div>
          )}

          {/* Thumbnail */}
          <div className="upload-thumb-section">
            <label className="form-label">Cover Image (optional)</label>
            <div className="upload-thumb-wrap" onClick={() => thumbRef.current?.click()}>
              <input ref={thumbRef} type="file" accept="image/*" hidden onChange={handleThumbChange} />
              {thumbPreview ? (
                <div className="upload-thumb-preview">
                  <img src={thumbPreview} alt="Cover" />
                  <button
                    type="button"
                    className="upload-thumb-remove"
                    onClick={e => { e.stopPropagation(); setThumbFile(null); setThumbPreview(null); }}
                  >
                    <MdClose />
                  </button>
                </div>
              ) : (
                <div className="upload-thumb-placeholder">
                  <MdImage />
                  <span>Add cover art</span>
                </div>
              )}
            </div>
          </div>

          {/* Privacy toggle */}
          <div className="upload-privacy">
            <label className="form-label">Visibility</label>
            <div className="upload-privacy__options">
              {[true, false].map(val => (
                <button
                  key={String(val)}
                  type="button"
                  className={`upload-privacy__opt${form.isPublic === val ? ' active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, isPublic: val }))}
                >
                  {val ? '🌍 Public' : '🔒 Private'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="upload-right">
          {field('title', 'Title *', 'text', 'Song title')}
          {field('artist', 'Artist *', 'text', 'Artist name')}
          {field('album', 'Album', 'text', 'Album name')}

          <div className="form-group">
            <label className="form-label">Genre</label>
            <select
              className="form-input"
              value={form.genre}
              onChange={e => setForm(p => ({ ...p, genre: e.target.value }))}
              disabled={uploading}
            >
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {field('year', 'Year', 'number', new Date().getFullYear())}

          <div className="form-group">
            <label className="form-label">Tags <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma-separated)</span></label>
            <input
              className="form-input"
              placeholder="chill, study, late-night"
              value={form.tags}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Lyrics <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              className="form-input upload-lyrics"
              placeholder="Paste lyrics here…"
              value={form.lyrics}
              onChange={e => setForm(p => ({ ...p, lyrics: e.target.value }))}
              disabled={uploading}
              rows={5}
            />
          </div>

          {/* Progress */}
          {uploading && progress > 0 && (
            <div className="upload-progress">
              <div className="upload-progress__bar">
                <div className="upload-progress__fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="upload-progress__text">{progress}%</span>
            </div>
          )}

          <div className="upload-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)} disabled={uploading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? <><span className="spinner" /> Uploading…</> : editId ? 'Save Changes' : '⬆ Upload Song'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

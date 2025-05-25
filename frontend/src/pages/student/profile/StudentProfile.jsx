import React, { useEffect, useState, useRef } from 'react';
import {
  Card, CardContent, Typography, Box, Avatar, Grid, TextField, Button, CircularProgress, IconButton, Tooltip, LinearProgress, Fade, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment
} from '@mui/material';
import { Email, Person, Wc, Cake, Home, Phone, CalendarToday, Edit, Save, CameraAlt, Logout, DarkMode, LightMode, Lock, ContentCopy, CheckCircle, Star } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const PROFILE_FIELDS = ['phone', 'gender', 'dob', 'address'];

const StudentProfile = ({ onThemeToggle, themeMode }) => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ phone: '', gender: '', dob: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const fileInputRef = useRef();
  const [about, setAbout] = useState('');
  const [aboutEdit, setAboutEdit] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/student/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
        setForm({
          phone: res.data.phone || '',
          gender: res.data.gender || '',
          dob: res.data.dob ? res.data.dob.substring(0, 10) : '',
          address: res.data.address || ''
        });
        setAbout(res.data.about || '');
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('/api/student/profile', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setAbout(res.data.about || '');
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // --- Avatar Upload ---
  const handleAvatarClick = () => {
    if (!avatarUploading) fileInputRef.current.click();
  };
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await axios.post('/api/student/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      setProfile((prev) => ({ ...prev, avatar: res.data.avatar }));
      toast.success('Profile picture updated!');
      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 1200);
    } catch (err) {
      toast.error('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  // --- Profile Completion ---
  const completion = Math.round((PROFILE_FIELDS.filter(f => profile?.[f]).length / PROFILE_FIELDS.length) * 100);

  // --- Quick Actions ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const handleThemeToggle = () => {
    if (onThemeToggle) onThemeToggle();
  };

  // --- Change Password ---
  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };
  const handlePasswordSubmit = async () => {
    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/student/profile/change-password', passwords, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Password changed!');
      setShowPasswordModal(false);
      setPasswords({ old: '', new: '' });
    } catch (err) {
      toast.error('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAboutSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('/api/student/profile', { ...form, about }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setAbout(res.data.about || '');
      setAboutEdit(false);
      toast.success('About Me updated!');
    } catch (err) {
      toast.error('Failed to update About Me');
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(profile?.email || '');
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1200);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Fade in timeout={600}>
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 5, p: 2 }}>
        <Card elevation={8} sx={{
          borderRadius: 6,
          p: 3,
          mt: 0,
          backdropFilter: 'blur(12px)',
          background: 'rgba(255,255,255,0.85)',
          boxShadow: '0 12px 40px 0 rgba(99,102,241,0.18)',
          position: 'relative',
          overflow: 'visible',
          transition: 'box-shadow 0.3s',
          '&:hover': { boxShadow: '0 16px 48px 0 rgba(99,102,241,0.22)' }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, position: 'relative' }}>
              <Box sx={{ position: 'relative', mb: 1 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    left: -8,
                    width: 112,
                    height: 112,
                    borderRadius: '50%',
                    background: 'conic-gradient(from 90deg, #6366f1, #f59e42, #6366f1)',
                    filter: avatarSuccess ? 'drop-shadow(0 0 16px #10b981)' : 'blur(0.5px)',
                    opacity: 0.7,
                    zIndex: 0,
                    animation: avatarSuccess ? 'glow 1.2s linear' : undefined,
                    transition: 'filter 0.3s',
                  }}
                />
                <Avatar
                  src={profile?.avatar}
                  sx={{
                    width: 96,
                    height: 96,
                    fontSize: 40,
                    border: '4px solid #fff',
                    boxShadow: 2,
                    zIndex: 1,
                    transition: 'box-shadow 0.3s',
                    '&:hover': { boxShadow: '0 0 0 6px #f59e4233' }
                  }}
                >
                  {profile?.name?.[0] || 'S'}
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                <Tooltip title="Change profile picture">
                  <IconButton
                    onClick={handleAvatarClick}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      border: '2px solid #fff',
                      p: 0.5,
                      zIndex: 2,
                      transition: 'transform 0.2s',
                      '&:active': { transform: 'scale(0.92)' }
                    }}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? <CircularProgress size={22} /> : avatarSuccess ? <CheckCircle color="success" /> : <CameraAlt fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="h5" fontWeight={700} color="primary.main" gutterBottom>
                {profile?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Student Profile
              </Typography>
              {/* Profile Completion */}
              <Box sx={{ width: '80%', mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={completion}
                  sx={{ height: 10, borderRadius: 5, transition: 'all 0.7s cubic-bezier(.4,2,.6,1)' }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>{completion}% complete</Typography>
              </Box>
              {/* Badges */}
              {profile?.badges && profile.badges.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {profile.badges.map((badge, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f4f6fb', px: 1.5, py: 0.5, borderRadius: 2, boxShadow: 1, gap: 0.5 }}>
                      <Star sx={{ color: '#f59e42', fontSize: 18 }} />
                      <Typography variant="caption" fontWeight={600}>{badge}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {/* Quick Actions */}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Tooltip title="Change Password">
                  <IconButton color="primary" onClick={() => setShowPasswordModal(true)} sx={{ transition: 'transform 0.2s', '&:active': { transform: 'scale(0.92)' } }}>
                    <Lock />
                  </IconButton>
                </Tooltip>
                <Tooltip title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                  <IconButton color="secondary" onClick={handleThemeToggle} sx={{ transition: 'transform 0.2s', '&:active': { transform: 'scale(0.92)' } }}>
                    {themeMode === 'dark' ? <LightMode /> : <DarkMode />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Logout">
                  <IconButton color="error" onClick={handleLogout} sx={{ transition: 'transform 0.2s', '&:active': { transform: 'scale(0.92)' } }}>
                    <Logout />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            {/* About Me Section */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ mb: 0.5 }}>
                About Me
              </Typography>
              {aboutEdit ? (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    value={about}
                    onChange={e => setAbout(e.target.value)}
                    size="small"
                    multiline
                    minRows={2}
                    maxRows={4}
                    fullWidth
                  />
                  <Button variant="contained" color="primary" onClick={handleAboutSave} sx={{ minWidth: 80 }}>Save</Button>
                  <Button variant="outlined" color="secondary" onClick={() => setAboutEdit(false)}>Cancel</Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{about || 'No about info yet.'}</Typography>
                  <Button size="small" onClick={() => setAboutEdit(true)} sx={{ minWidth: 0, px: 1 }}>Edit</Button>
                </Box>
              )}
            </Box>
            {/* Info Sections */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ mb: 1 }}>
                Contact & Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email color="action" />
                    <Typography variant="body1">{profile?.email}</Typography>
                    <Tooltip title={copySuccess ? 'Copied!' : 'Copy Email'}>
                      <IconButton size="small" onClick={handleCopyEmail} sx={{ ml: 0.5 }}>
                        {copySuccess ? <CheckCircle color="success" fontSize="small" /> : <ContentCopy fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="action" />
                    <Typography variant="body1">{profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone color="action" />
                    {editMode ? (
                      <TextField
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        size="small"
                        placeholder="Phone"
                        fullWidth
                      />
                    ) : (
                      <Typography variant="body1">{profile?.phone || '-'}</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Wc color="action" />
                    {editMode ? (
                      <TextField
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        size="small"
                        placeholder="Gender"
                        fullWidth
                      />
                    ) : (
                      <Typography variant="body1">{profile?.gender || '-'}</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Cake color="action" />
                    {editMode ? (
                      <TextField
                        name="dob"
                        type="date"
                        value={form.dob}
                        onChange={handleChange}
                        size="small"
                        fullWidth
                      />
                    ) : (
                      <Typography variant="body1">{profile?.dob ? profile.dob.substring(0, 10) : '-'}</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Home color="action" />
                    {editMode ? (
                      <TextField
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        size="small"
                        placeholder="Address"
                        fullWidth
                      />
                    ) : (
                      <Typography variant="body1">{profile?.address || '-'}</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday color="action" />
                    <Typography variant="body1">
                      {profile?.createdAt ? profile.createdAt.substring(0, 10) : '-'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
              {editMode ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setEditMode(true)}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
        {/* Change Password Modal */}
        <Dialog open={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <TextField
              label="Old Password"
              name="old"
              type="password"
              value={passwords.old}
              onChange={handlePasswordChange}
              fullWidth
              margin="normal"
              InputProps={{ startAdornment: <InputAdornment position="start"><Lock /></InputAdornment> }}
            />
            <TextField
              label="New Password"
              name="new"
              type="password"
              value={passwords.new}
              onChange={handlePasswordChange}
              fullWidth
              margin="normal"
              InputProps={{ startAdornment: <InputAdornment position="start"><Lock /></InputAdornment> }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPasswordModal(false)} color="secondary">Cancel</Button>
            <Button onClick={handlePasswordSubmit} color="primary" disabled={passwordLoading}>
              {passwordLoading ? <CircularProgress size={20} /> : 'Change Password'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default StudentProfile;

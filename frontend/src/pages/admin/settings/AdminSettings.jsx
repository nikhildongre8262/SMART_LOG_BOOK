import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Tabs, Tab, Avatar, TextField, Button, Grid, Switch, 
  FormControlLabel, Divider, IconButton, InputAdornment, Card, CardContent, 
  CardHeader, Alert, LinearProgress, Snackbar, Radio, RadioGroup, FormLabel, 
  FormControl, Select, MenuItem, InputLabel 
} from '@mui/material';
import { 
  Edit, Save, Visibility, VisibilityOff, Settings, Brightness4, Brightness7, 
  CheckCircle, Error, SystemUpdateAlt, Language, Lock, Notifications
} from '@mui/icons-material';

const AdminSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Profile state
  const [profile, setProfile] = useState({
    name: 'Admin User',
    email: 'admin@example.com',
    avatar: '',
  });
  const [profileError, setProfileError] = useState({});
  const [editingProfile, setEditingProfile] = useState(false);

  // Password state
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
  });
  const [passwordError, setPasswordError] = useState({});

  // Notification state
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  // Theme state
  const [theme, setTheme] = useState('light');
  const [themePreview, setThemePreview] = useState(false);

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    defaultLanguage: 'en',
    passwordPolicy: 'medium',
  });

  // Tab state
  const [tab, setTab] = useState(0);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const validateProfile = () => {
    const errors = {};
    if (!profile.name.trim()) errors.name = 'Name is required';
    if (!profile.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(profile.email)) errors.email = 'Email is invalid';
    setProfileError(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};
    if (!password.current) errors.current = 'Current password is required';
    if (!password.new) errors.new = 'New password is required';
    else if (password.new.length < 8) errors.new = 'Password must be at least 8 characters';
    if (password.new !== password.confirm) errors.confirm = 'Passwords do not match';
    setPasswordError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = () => {
    if (!validateProfile()) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setEditingProfile(false);
      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
    }, 1500);
  };

  const handleChangePassword = () => {
    if (!validatePassword()) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setPassword({ current: '', new: '', confirm: '', showCurrent: false, showNew: false, showConfirm: false });
      setSnackbar({ open: true, message: 'Password changed successfully', severity: 'success' });
    }, 1500);
  };

  const handleSaveNotifications = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setSnackbar({ open: true, message: 'Notification preferences saved', severity: 'success' });
    }, 1000);
  };

  const handleSaveSystemSettings = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setSnackbar({ open: true, message: 'System settings updated', severity: 'success' });
    }, 1500);
  };

  const handleThemePreview = (newTheme) => {
    setThemePreview(true);
    setTheme(newTheme);
    setTimeout(() => setThemePreview(false), 2000);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 4 }, maxWidth: 1200, mx: 'auto', mt: 6 }}>
      {isLoading && <LinearProgress />}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          icon={snackbar.severity === 'success' ? <CheckCircle fontSize="inherit" /> : <Error fontSize="inherit" />}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Card elevation={3} sx={{ borderRadius: 3, mb: 4 }}>
        <CardHeader 
          title="Admin Settings" 
          titleTypographyProps={{ variant: 'h4', fontWeight: 700 }}
          avatar={<Settings color="primary" sx={{ fontSize: 40 }} />}
          sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)', pb: 2 }}
        />
        
        <CardContent>
          <Tabs 
            value={tab} 
            onChange={(_, v) => setTab(v)} 
            variant="scrollable" 
            scrollButtons="auto" 
            sx={{ mb: 4 }}
          >
            <Tab label="Profile" icon={<Edit />} iconPosition="start" />
            <Tab label="Password" icon={<Lock />} iconPosition="start" />
            <Tab label="Notifications" icon={<Notifications />} iconPosition="start" />
            <Tab label="Theme" icon={theme === 'light' ? <Brightness7 /> : <Brightness4 />} iconPosition="start" />
            <Tab label="System" icon={<SystemUpdateAlt />} iconPosition="start" />
          </Tabs>

          {/* Profile Tab */}
          {tab === 0 && (
            <Box>
              <Box display="flex" alignItems="center" gap={3} mb={4}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 40 }}>
                  {profile.name[0]}
                </Avatar>
                <Box>
                  <Typography variant="h5">{profile.name}</Typography>
                  <Typography variant="body1" color="text.secondary">{profile.email}</Typography>
                </Box>
                <Box flexGrow={1} />
                <Button 
                  variant="outlined" 
                  startIcon={<Edit />} 
                  onClick={() => setEditingProfile((v) => !v)}
                  sx={{ minWidth: 120 }}
                >
                  {editingProfile ? 'Cancel' : 'Edit'}
                </Button>
              </Box>
              
              {editingProfile && (
                <>
                  <Grid container spacing={3} mb={3}>
                    <Grid item xs={12} md={6}>
                      <TextField 
                        label="Name" 
                        name="name" 
                        value={profile.name} 
                        onChange={(e) => setProfile({ ...profile, [e.target.name]: e.target.value })}
                        error={!!profileError.name}
                        helperText={profileError.name}
                        fullWidth 
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField 
                        label="Email" 
                        name="email" 
                        value={profile.email} 
                        onChange={(e) => setProfile({ ...profile, [e.target.name]: e.target.value })}
                        error={!!profileError.email}
                        helperText={profileError.email}
                        fullWidth 
                      />
                    </Grid>
                  </Grid>
                  
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<Save />} 
                    onClick={handleSaveProfile}
                    sx={{ minWidth: 180 }}
                  >
                    Save Profile
                  </Button>
                </>
              )}
            </Box>
          )}

          {/* Password Tab */}
          {tab === 1 && (
            <Box>
              <Typography variant="h6" mb={3}>Change Password</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Current Password"
                    name="current"
                    type={password.showCurrent ? 'text' : 'password'}
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, [e.target.name]: e.target.value })}
                    error={!!passwordError.current}
                    helperText={passwordError.current}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setPassword({ ...password, showCurrent: !password.showCurrent })}>
                            {password.showCurrent ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="New Password"
                    name="new"
                    type={password.showNew ? 'text' : 'password'}
                    value={password.new}
                    onChange={(e) => setPassword({ ...password, [e.target.name]: e.target.value })}
                    error={!!passwordError.new}
                    helperText={passwordError.new}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setPassword({ ...password, showNew: !password.showNew })}>
                            {password.showNew ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Confirm Password"
                    name="confirm"
                    type={password.showConfirm ? 'text' : 'password'}
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, [e.target.name]: e.target.value })}
                    error={!!passwordError.confirm}
                    helperText={passwordError.confirm}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setPassword({ ...password, showConfirm: !password.showConfirm })}>
                            {password.showConfirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              
              <Box mt={3}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<Save />} 
                  onClick={handleChangePassword}
                  sx={{ minWidth: 220 }}
                >
                  Change Password
                </Button>
              </Box>
            </Box>
          )}

          {/* Notifications Tab */}
          {tab === 2 && (
            <Box>
              <Typography variant="h6" mb={3}>Notification Preferences</Typography>
              
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" mb={2}>Notification Methods</Typography>
                  <FormControlLabel
                    control={<Switch checked={notifications.email} onChange={(e) => setNotifications({ ...notifications, [e.target.name]: e.target.checked })} name="email" color="primary" />}
                    label="Email Notifications"
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={<Switch checked={notifications.sms} onChange={(e) => setNotifications({ ...notifications, [e.target.name]: e.target.checked })} name="sms" color="primary" />}
                    label="SMS Notifications"
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={<Switch checked={notifications.push} onChange={(e) => setNotifications({ ...notifications, [e.target.name]: e.target.checked })} name="push" color="primary" />}
                    label="Push Notifications"
                  />
                </CardContent>
              </Card>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Save />} 
                onClick={handleSaveNotifications}
                sx={{ minWidth: 220 }}
              >
                Save Preferences
              </Button>
            </Box>
          )}

          {/* Theme Tab */}
          {tab === 3 && (
            <Box>
              <Typography variant="h6" mb={3}>Theme Settings</Typography>
              
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={3} mb={2}>
                    <Brightness7 color={theme === 'light' ? 'primary' : 'disabled'} sx={{ fontSize: 30 }} />
                    <Switch 
                      checked={theme === 'dark'} 
                      onChange={() => handleThemePreview(theme === 'light' ? 'dark' : 'light')} 
                      color="primary" 
                      size="medium"
                    />
                    <Brightness4 color={theme === 'dark' ? 'primary' : 'disabled'} sx={{ fontSize: 30 }} />
                    <Typography variant="h6">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</Typography>
                  </Box>
                  
                  {themePreview && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Preview mode - Theme will revert in 2 seconds
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}

          {/* System Tab */}
          {tab === 4 && (
            <Box>
              <Typography variant="h6" mb={3}>System Settings</Typography>
              
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" mb={2}>Application Settings</Typography>
                  
                  <FormControlLabel
                    control={<Switch checked={systemSettings.maintenanceMode} onChange={(e) => setSystemSettings({ ...systemSettings, [e.target.name]: e.target.checked })} name="maintenanceMode" color="primary" />}
                    label="Maintenance Mode"
                    sx={{ mb: 3, display: 'block' }}
                  />
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="default-language-label">Default Language</InputLabel>
                    <Select
                      labelId="default-language-label"
                      value={systemSettings.defaultLanguage}
                      label="Default Language"
                      onChange={(e) => setSystemSettings({ ...systemSettings, defaultLanguage: e.target.value })}
                      startAdornment={<Language color="action" sx={{ mr: 1 }} />}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                      <MenuItem value="de">German</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl component="fieldset" sx={{ mb: 3 }}>
                    <FormLabel component="legend">Password Policy</FormLabel>
                    <RadioGroup
                      row
                      aria-label="password-policy"
                      name="passwordPolicy"
                      value={systemSettings.passwordPolicy}
                      onChange={(e) => setSystemSettings({ ...systemSettings, passwordPolicy: e.target.value })}
                    >
                      <FormControlLabel value="low" control={<Radio />} label="Low" />
                      <FormControlLabel value="medium" control={<Radio />} label="Medium" />
                      <FormControlLabel value="high" control={<Radio />} label="High" />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Save />} 
                onClick={handleSaveSystemSettings}
                sx={{ minWidth: 220 }}
              >
                Save System Settings
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminSettings;
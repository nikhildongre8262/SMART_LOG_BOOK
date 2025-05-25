import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, Typography, Paper, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip, Tooltip, CircularProgress, TextField, InputAdornment, MenuItem, Select, Checkbox, Toolbar, Avatar
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Archive, Search, Group as GroupIcon, Refresh, Info } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const statusColors = {
  active: 'success',
  inactive: 'warning',
  archived: 'default',
};

const AdminGroups = () => {
  const { user, token } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('');
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);
  const [archivingId, setArchivingId] = useState(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/groups', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, status, sort },
      });
      setGroups(res.data);
    } catch (err) {
      toast.error('Failed to load groups');
    }
    setLoading(false);
  }, [token, search, status, sort]);

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line
  }, [search, status, sort, fetchGroups]);

  const handleDelete = async (id) => {
    const confirmDelete = window.prompt('Type DELETE to confirm group deletion:');
    if (confirmDelete !== 'DELETE') return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/groups/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Group deleted successfully');
      fetchGroups();
    } catch (err) {
      toast.error('Failed to delete group');
    }
    setDeletingId(null);
  };


  const handleArchive = async (id) => {
    if (!window.confirm('Archive this group?')) return;
    setArchivingId(id);
    try {
      await axios.patch(`/api/groups/${id}/status`, { status: 'archived' }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Group archived');
      fetchGroups();
    } catch (err) {
      toast.error('Failed to archive group');
    }
    setArchivingId(null);
  };

  // Bulk selection logic
  const isSelected = (id) => selected.indexOf(id) !== -1;
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(groups.map((g) => g._id));
    } else {
      setSelected([]);
    }
  };
  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };
  // Bulk archive/delete/export
  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    const confirmDelete = window.prompt('Type DELETE to confirm bulk group deletion:');
    if (confirmDelete !== 'DELETE') return;
    for (let id of selected) {
      await handleDelete(id);
    }
    setSelected([]);
  };
  const handleBulkArchive = async () => {
    if (selected.length === 0) return;
    if (!window.confirm('Archive selected groups?')) return;
    for (let id of selected) {
      await handleArchive(id);
    }
    setSelected([]);
  };
  const handleExport = (type = 'csv') => {
    const exportGroups = groups.filter((g) => selected.includes(g._id));
    if (type === 'csv') {
      const csv = [
        ['Name', 'Code', 'Description', 'Created', 'Last Activity', 'Status', 'Sub-Groups'],
        ...exportGroups.map(g => [
          g.name,
          g.mainGroupCode,
          g.description,
          new Date(g.createdAt).toLocaleDateString(),
          new Date(g.lastActivityAt).toLocaleDateString(),
          g.status,
          g.subGroups?.length || 0
        ])
      ].map(e => e.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'groups.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === 'json') {
      const blob = new Blob([JSON.stringify(exportGroups, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'groups.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Main Groups</Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => navigate('/admin/groups/create')} sx={{ borderRadius: 2, fontWeight: 600 }}>
          Create Main Group
        </Button>
      </Box>
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#f8faff', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Manage your main groups. You can create, edit, archive, or delete groups. Use the filters and search to quickly find groups.
        </Typography>
      </Paper>
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 1 }}>
        {selected.length > 0 && (
          <Toolbar sx={{ mb: 2, bgcolor: 'primary.lighter', borderRadius: 2 }}>
            <Typography sx={{ flex: 1 }} color="primary.main" fontWeight={600}>{selected.length} selected</Typography>
            <Tooltip title="Archive selected groups">
              <Button onClick={handleBulkArchive} color="warning" startIcon={<Archive />}>Archive</Button>
            </Tooltip>
            <Tooltip title="Delete selected groups">
              <Button onClick={handleBulkDelete} color="error" startIcon={<Delete />}>Delete</Button>
            </Tooltip>
            <Tooltip title="Export selected as CSV">
              <Button onClick={() => handleExport('csv')} color="info" startIcon={<Info />}>Export CSV</Button>
            </Tooltip>
            <Tooltip title="Export selected as JSON">
              <Button onClick={() => handleExport('json')} color="info" startIcon={<Info />}>Export JSON</Button>
            </Tooltip>
          </Toolbar>
        )}
        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
          <Box display="flex" gap={2} alignItems="center" mb={0}>
            <TextField
              label="Search"
              size="small"
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />
            <Select
              value={status}
              onChange={e => setStatus(e.target.value)}
              displayEmpty
              size="small"
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
            <Select
              value={sort}
              onChange={e => setSort(e.target.value)}
              displayEmpty
              size="small"
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">Sort By</MenuItem>
              <MenuItem value="alpha">Alphabetical</MenuItem>
              <MenuItem value="members">Member Count</MenuItem>
              <MenuItem value="">Last Activity</MenuItem>
            </Select>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchGroups}><Refresh /></IconButton>
            </Tooltip>
          </Box>
        </Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : groups.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6}>
            <Avatar sx={{ width: 80, height: 80, mb: 3, bgcolor: 'primary.lighter' }}>
              <GroupIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </Avatar>
            <Typography variant="h6" align="center" gutterBottom>
              No groups found
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 500, mb: 3 }}>
              Create your first main group to get started. Groups help organize your users and resources.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selected.length > 0 && selected.length < groups.length}
                      checked={groups.length > 0 && selected.length === groups.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Last Activity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sub-Groups</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groups.map(group => {
                  let borderColor = 'grey.300';
                  if (group.status === 'active') borderColor = 'success.main';
                  else if (group.status === 'inactive') borderColor = 'warning.main';
                  else if (group.status === 'archived') borderColor = 'grey.500';
                  return (
                    <TableRow key={group._id} selected={isSelected(group._id)} hover style={{ cursor: 'pointer', borderLeft: `6px solid`, borderLeftColor: borderColor }} onClick={e => {
                      if (!e.target.closest('button')) navigate(`/admin/groups/${group._id}`);
                    }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isSelected(group._id)}
                          onChange={evt => { evt.stopPropagation(); handleSelect(group._id); }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 16 }}>
                            <GroupIcon sx={{ fontSize: 20, color: 'white' }} />
                          </Avatar>
                          <Typography fontWeight={600}>{group.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{group.mainGroupCode}</TableCell>
                      <TableCell>
                        <Tooltip title={group.description || ''}>
                          <span>{group.description?.slice(0, 32)}{group.description?.length > 32 ? '...' : ''}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{new Date(group.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(group.lastActivityAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip label={group.status} color={statusColors[group.status] || 'default'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={group.subGroups?.length || 0} color={group.subGroups?.length > 0 ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View group details">
                          <IconButton color="primary" onClick={() => navigate(`/admin/groups/${group._id}`)}><Visibility /></IconButton>
                        </Tooltip>
                        <Tooltip title="Edit group">
                          <IconButton color="secondary" onClick={() => navigate(`/admin/groups/${group._id}/edit`)}><Edit /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete group">
                          <span>
                            <IconButton color="error" onClick={() => handleDelete(group._id)} disabled={deletingId === group._id}>
                              {deletingId === group._id ? <CircularProgress size={20} /> : <Delete />}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Archive group">
                          <span>
                            <IconButton color="default" onClick={() => handleArchive(group._id)} disabled={archivingId === group._id}>
                              {archivingId === group._id ? <CircularProgress size={20} /> : <Archive />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default AdminGroups;

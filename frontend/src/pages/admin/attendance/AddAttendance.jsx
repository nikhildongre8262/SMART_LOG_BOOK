import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, MenuItem, Divider, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuth } from '../../../contexts/AuthContext.js'; // adjust path if needed

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AddAttendance = ({ group, subGroup, editingAttendance, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [date, setDate] = useState(editingAttendance ? dayjs(editingAttendance.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
  const [lectureNo, setLectureNo] = useState(editingAttendance ? editingAttendance.lectureNo : '');
  const [day, setDay] = useState(editingAttendance ? editingAttendance.day : weekdays[new Date().getDay()]);
  const [subject, setSubject] = useState(editingAttendance ? editingAttendance.subject || '' : '');
  const [remarks, setRemarks] = useState(editingAttendance ? editingAttendance.remarks || '' : '');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch students of the main group (role: student)
  useEffect(() => {
    if (!group) return;
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/groups/${group._id}/students`, { headers: { Authorization: `Bearer ${token}` } });
        setStudents(res.data);
        
        // Initialize attendance
        if (editingAttendance) {
          // For edit mode, set existing attendance
          const initial = {};
          editingAttendance.records.forEach(record => {
            initial[record.studentId._id] = record.present;
          });
          setAttendance(initial);
        } else {
          // For add mode, set all present by default
          const initial = {};
          res.data.forEach(s => { initial[s._id] = true; });
          setAttendance(initial);
        }
      } catch (err) {
        toast.error('Failed to fetch students');
      }
      setLoading(false);
    };
    fetchStudents();
  }, [group, token, editingAttendance]);

  // Update day when date changes
  useEffect(() => {
    setDay(weekdays[new Date(date).getDay()]);
  }, [date]);

  const handleToggleAttendance = (studentId) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const records = students.map(s => ({ studentId: s._id, present: !!attendance[s._id] }));
      
      if (editingAttendance) {
        // Update existing attendance
        await axios.put(`/api/attendance/${editingAttendance._id}`, {
          date,
          lectureNo,
          day,
          subject,
          remarks,
          records
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Attendance updated successfully!');
      } else {
        // Create new attendance
        await axios.post('/api/attendance', {
          groupId: group._id,
          subGroupId: subGroup._id,
          date,
          lectureNo,
          day,
          subject,
          remarks,
          records
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Attendance saved successfully!');
      }
      
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(editingAttendance ? 'Failed to update attendance' : 'Failed to save attendance');
      setLoading(false);
    }
  };

  if (!group || !subGroup) return <Typography color="error">Invalid navigation. Please select group and sub-group.</Typography>;

  return (
    <Box sx={{ maxWidth: 600, m: 'auto', p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>{editingAttendance ? 'Edit Attendance' : 'Add Attendance'}</Typography>
        <Divider sx={{ mb: 2 }} />
        <form onSubmit={handleSubmit} autoComplete="off">
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              sx={{ flex: 1 }}
            />
            <TextField
              label="Lecture No."
              type="number"
              value={lectureNo}
              onChange={e => setLectureNo(e.target.value.replace(/[^0-9]/g, ''))}
              required
              inputProps={{ min: 1 }}
              error={lectureNo !== '' && (isNaN(lectureNo) || lectureNo < 1)}
              helperText={lectureNo !== '' && (isNaN(lectureNo) || lectureNo < 1) ? 'Enter valid lecture number' : ''}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Day"
              value={day}
              select
              onChange={e => setDay(e.target.value)}
              sx={{ flex: 1 }}
            >
              {weekdays.map(wd => <MenuItem key={wd} value={wd}>{wd}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Remarks"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              sx={{ flex: 2 }}
            />
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1">Student List</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Button variant="outlined" color="success" size="small" onClick={() => setAttendance(Object.fromEntries(students.filter(s => s.visible !== false).map(s => [s._id, true])))}>Mark All Present</Button>
            <Button variant="outlined" color="error" size="small" onClick={() => setAttendance(Object.fromEntries(students.filter(s => s.visible !== false).map(s => [s._id, false])))}>Mark All Absent</Button>
          </Box>
          {/* Student search/filter */}
          <TextField
            label="Search Student"
            variant="outlined"
            size="small"
            sx={{ mb: 1, width: '100%' }}
            onChange={e => {
              const val = e.target.value.toLowerCase();
              setStudents(prev => prev.map(s => ({ ...s, visible: !val || s.name.toLowerCase().includes(val) })));
            }}
          />
          {loading ? <CircularProgress size={28} /> : (
            <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
              {students.filter(s => s.visible !== false).map(s => (
                <Box key={s._id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                  <Typography sx={{ flex: 1 }}>{s.name}</Typography>
                  <Button
                    variant={attendance[s._id] ? 'contained' : 'outlined'}
                    color={attendance[s._id] ? 'success' : 'error'}
                    onClick={() => handleToggleAttendance(s._id)}
                  >
                    {attendance[s._id] ? 'Present' : 'Absent'}
                  </Button>
                </Box>
              ))}
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading || !date || !lectureNo || isNaN(lectureNo) || lectureNo < 1 || students.length === 0}
            >
              {editingAttendance ? 'Update Attendance' : 'Save Attendance'}
            </Button>
            <Button variant="outlined" color="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AddAttendance;

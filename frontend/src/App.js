import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/auth/Signup';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminGroups from './pages/admin/groups/AdminGroups.jsx';
import CreateGroup from './pages/admin/groups/CreateGroup.jsx';
import EditGroup from './pages/admin/groups/EditGroup.jsx';
import GroupDetail from './pages/admin/groups/GroupDetail.jsx';
import AdminStudents from './pages/admin/students/AdminStudents.jsx';
import StudentMainDashboard from './pages/student/StudentMainDashboard.jsx';
import StudentAttendanceDashboard from './pages/student/attendance/StudentAttendanceDashboard.jsx';
import Forbidden from './pages/errors/Forbidden';
import ProtectedRoute from './components/ProtectedRoute';
import AssignmentDashboard from './pages/admin/assignments/AssignmentDashboard.jsx';
import AttendanceDashboard from './pages/admin/attendance/AttendanceDashboard.jsx';
import AddAttendance from './pages/admin/attendance/AddAttendance.jsx';
import EditAttendance from './pages/admin/attendance/EditAttendance.jsx';
import StudyResourceDashboard from './pages/admin/resources/StudyResourceDashboard.jsx';
import AssignmentDetail from './pages/student/assignment/AssignmentDetail.jsx';
import AdminSettings from './pages/admin/settings/AdminSettings.jsx';
import StudentProfile from './pages/student/profile/StudentProfile.jsx';
import GroupsPanel from './pages/student/groups/GroupsPanel.jsx';
import StudyResources from './pages/student/resources/StudyResources.jsx';
import StudentLayout from './pages/student/StudentLayout.jsx';
import StudentAssignmentDashboard from './pages/student/assignment/AssignmentDashboard.jsx';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
  typography: {
    fontFamily: 'Roboto, Arial',
    fontWeightBold: 700,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forbidden" element={<Forbidden />} />
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}> 
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/groups" element={<AdminGroups />} />
          <Route path="/admin/groups/create" element={<CreateGroup />} />
          <Route path="/admin/groups/:id" element={<GroupDetail />} />
          <Route path="/admin/attendance" element={<AttendanceDashboard />} />
          <Route path="/admin/attendance/add" element={<AddAttendance />} />
          <Route path="/admin/attendance/edit/:attendanceId" element={<EditAttendance />} />
          <Route path="/admin/assignments" element={<AssignmentDashboard />} />
          <Route path="/admin/groups/:id/edit" element={<EditGroup />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/study-resource" element={<StudyResourceDashboard />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['student']} />}> 
          <Route element={<StudentLayout />}>
            <Route path="/student/dashboard" element={<StudentMainDashboard />} />
            <Route path="/student/groups" element={<GroupsPanel />} />
            <Route path="/student/attendance" element={<StudentAttendanceDashboard />} />
            <Route path="/student/resources" element={<StudyResources />} />
            <Route path="/student/assignments" element={<StudentAssignmentDashboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />
          </Route>
          <Route path="/student/assignment/:id" element={<AssignmentDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;

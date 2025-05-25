import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import AssignmentDashboard from '../assignment/AssignmentDashboard';
// Placeholder imports for future modules
// import StudentAttendance from '../attendance/StudentAttendance';
// import StudentResources from '../resources/StudentResources';

export default function SubGroupModules({ subGroup }) {
  const [tab, setTab] = useState(0);
  if (!subGroup) return null;

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Assignments" />
        <Tab label="Attendance" />
        <Tab label="Resources" />
      </Tabs>
      {/* Assignments Tab */}
      {tab === 0 && (
        <AssignmentDashboard subGroup={subGroup} />
      )}
      {/* Attendance Tab */}
      {tab === 1 && (
        <Box p={2}>
          <Typography color="text.secondary">Attendance module coming soon...</Typography>
        </Box>
      )}
      {/* Resources Tab */}
      {tab === 2 && (
        <Box p={2}>
          <Typography color="text.secondary">Resources module coming soon...</Typography>
        </Box>
      )}
    </Box>
  );
}

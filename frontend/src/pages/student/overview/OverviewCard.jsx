import React from "react";
import { Card, Typography, Avatar, Grid } from "@mui/material";

const OverviewCard = ({ student, stats }) => (
  <Card sx={{ p: 3, mb: 3 }}>
    <Grid container alignItems="center" spacing={2}>
      <Grid item>
        <Avatar src={student.avatar} sx={{ width: 56, height: 56 }} />
      </Grid>
      <Grid item xs>
        <Typography variant="h5">Hello, {student.name}!</Typography>
        <Typography variant="subtitle1">Welcome back to your dashboard.</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item>
            <Typography variant="body2">Groups: {stats.groups}</Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2">Assignments Due: {stats.assignmentsDue}</Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2">Events: {stats.events}</Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2">Attendance: {stats.attendance}%</Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2">Badges: {stats.badges}</Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  </Card>
);

export default OverviewCard;

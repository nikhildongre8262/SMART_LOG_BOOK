import React from "react";
import { Card, Typography, Box, Chip } from "@mui/material";

const BadgesPanel = ({ badges }) => (
  <Card sx={{ p: 2, mb: 3 }}>
    <Typography variant="h6">My Badges</Typography>
    <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
      {badges && badges.length > 0 ? (
        badges.map((badge) => (
          <Chip key={badge._id} label={badge.name} color="primary" />
        ))
      ) : (
        <Typography variant="body2">No badges earned yet.</Typography>
      )}
    </Box>
  </Card>
);

export default BadgesPanel;

import React from "react";
import { Card, Typography, Button } from "@mui/material";

const HelpSupport = () => (
  <Card sx={{ p: 2, mb: 3 }}>
    <Typography variant="h6">Help & Support</Typography>
    <Typography variant="body2" sx={{ mb: 2 }}>
      Need help? Check the FAQ or contact your admin for support.
    </Typography>
    <Button variant="contained" color="secondary">Contact Admin</Button>
  </Card>
);

export default HelpSupport;

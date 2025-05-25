import { Settings } from '@mui/icons-material';

<ListItemButton selected={selected === 'settings'} onClick={() => onSelect('settings') || navigate('/admin/settings')}>
  <ListItemIcon><Settings /></ListItemIcon>
  <ListItemText primary="Settings" />
</ListItemButton> 
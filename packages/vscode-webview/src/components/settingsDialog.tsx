import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useState } from 'react';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDialog = ({ open, onClose }: SettingsDialogProps) => {
  const [schema, setSchema] = useState<any[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open) {
      vscode.postMessage({ type: 'getAllSettings' });
    }
  }, [open]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'ALL_SETTINGS') {
        setSchema(msg.schema);
        setValues(msg.values);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleChange = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    vscode.postMessage({ type: 'setSetting', key: `cpbuddy.${key}`, value });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={false} 
      fullWidth={true}
      PaperProps={{ 
        sx: { 
          width: '80vw !important', 
          maxWidth: '1200px !important', 
          minWidth: '600px',
          height: '80vh', 
          borderRadius: '16px', 
          background: '#1e1e1e', 
          p: 2, 
          m: 2 
        } 
      }}
    >
      <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        CPBuddy Settings
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ mt: 1 }}>
        {schema.map((section, idx) => (
          <Box key={idx} sx={{ mb: 5 }}>
            <Typography variant="h5" sx={{ mb: 3, borderBottom: '1px solid #444', pb: 1, color: '#e0e0e0' }}>
              {section.title}
            </Typography>
            {Object.entries(section.properties).map(([fullKey, prop]: [string, any]) => {
              const key = fullKey.replace('cpbuddy.', '');
              const val = values[key];
              const desc = (prop.markdownDescription || prop.description || '').replace(/\*\*/g, '').replace(/#cpbuddy[^#]+#/g, '');

              if (prop.type === 'boolean') {
                return (
                  <Box key={key} sx={{ mb: 3, p: 2, borderRadius: '8px', bgcolor: 'rgba(255, 255, 255, 0.03)' }}>
                    <FormControlLabel
                      control={<Switch checked={!!val} onChange={(e) => handleChange(key, e.target.checked)} color="primary" />}
                      label={<Typography variant="subtitle1" fontWeight={500}>{key}</Typography>}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5, lineHeight: 1.5 }}>
                      {desc}
                    </Typography>
                  </Box>
                );
              }

              if (prop.type === 'string' && prop.enum) {
                return (
                  <Box key={key} sx={{ mb: 3, p: 2, borderRadius: '8px', bgcolor: 'rgba(255, 255, 255, 0.03)' }}>
                    <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1 }}>{key}</Typography>
                    <FormControl fullWidth size="small">
                      <Select value={val ?? prop.default ?? ''} onChange={(e) => handleChange(key, e.target.value)}>
                        {prop.enum.map((opt: string) => (
                          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.5 }}>
                      {desc}
                    </Typography>
                  </Box>
                );
              }

              if (prop.type === 'string' || prop.type === 'number') {
                return (
                  <Box key={key} sx={{ mb: 3, p: 2, borderRadius: '8px', bgcolor: 'rgba(255, 255, 255, 0.03)' }}>
                    <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1 }}>{key}</Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={val ?? ''}
                      onChange={(e) => {
                        const parsed = prop.type === 'number' ? Number(e.target.value) : e.target.value;
                        handleChange(key, parsed);
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.5 }}>
                      {desc}
                    </Typography>
                  </Box>
                );
              }

              return null;
            })}
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
};

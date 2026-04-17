import type { SxProps, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

interface CPBuddyTextProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const CPBuddyText = (props: CPBuddyTextProps) => {
  return (
    <Typography
      component='span'
      sx={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: 'default',
        userSelect: 'none',
        ...props.sx,
      }}
    >
      {props.children}
    </Typography>
  );
};

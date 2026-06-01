import Stack from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';
import type { MouseEventHandler } from 'react';

interface CPBuddyFlexProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  smallGap?: boolean;
  column?: boolean;
  alignStart?: boolean;
  onClick?: MouseEventHandler;
}

export const CPBuddyFlex = (props: CPBuddyFlexProps) => {
  return (
    <Stack
      onClick={props.onClick}
      sx={{
        alignItems: props.alignStart ? 'flex-start' : 'center',
        flexDirection: props.column ? 'column' : 'row',
        gap: props.smallGap ? 0.5 : 1,
        width: '100%',
        minWidth: 0,
        ...props.sx,
      }}
    >
      {props.children}
    </Stack>
  );
};

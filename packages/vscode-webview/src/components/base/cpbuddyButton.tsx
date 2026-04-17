import IconButton, { type IconButtonOwnProps } from '@mui/material/IconButton';
import type SvgIcon from '@mui/material/SvgIcon';
import type { SxProps, Theme } from '@mui/material/styles';
import { forwardRef, type MouseEventHandler } from 'react';
import { CPBuddyTooltip } from '@/components/base/cpbuddyTooltip';

interface CPBuddyButtonProps {
  sx?: SxProps<Theme>;
  icon: typeof SvgIcon;
  name: string;
  color?: IconButtonOwnProps['color'];
  larger?: boolean;
  onClick?: MouseEventHandler;
  disabled?: boolean;
}

export const CPBuddyButton = forwardRef<HTMLButtonElement, CPBuddyButtonProps>((props, ref) => (
  <CPBuddyTooltip title={props.name}>
    <IconButton
      ref={ref}
      color={props.color ?? 'primary'}
      size={props.larger ? 'medium' : 'small'}
      onClick={props.onClick}
      disabled={props.disabled}
      sx={props.sx}
    >
      <props.icon fontSize='small' />
    </IconButton>
  </CPBuddyTooltip>
));

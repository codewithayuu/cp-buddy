import Link from '@mui/material/Link';
import type { SxProps, Theme } from '@mui/material/styles';
import type { MouseEventHandler } from 'react';
import { CPBuddyTooltip } from '@/components/base/cpbuddyTooltip';

interface CPBuddyLinkProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  name: string;
  onClick?: MouseEventHandler;
}

export const CPBuddyLink = (props: CPBuddyLinkProps) => {
  return (
    <CPBuddyTooltip title={props.name}>
      <Link
        href='#'
        underline='hover'
        onClick={props.onClick}
        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', ...props.sx }}
      >
        {props.children}
      </Link>
    </CPBuddyTooltip>
  );
};
